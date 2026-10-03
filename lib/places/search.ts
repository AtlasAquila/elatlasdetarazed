import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Buscador de lugares de nacimiento. Datos: GeoNames (CC BY 4.0), poblaciones de más de 500 habitantes,
 * con su zona horaria IANA. Se cargan en memoria la primera vez que se usan.
 */

export type Place = {
  name: string;
  region: string;
  country: string;
  countryName: string;
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  population: number;
};

type Index = {
  /** Clave normalizada de búsqueda y fila a la que apunta (un lugar puede tener varias claves). */
  keys: string[];
  rowOf: number[];
  rows: string[];
  zones: string[];
};

let index: Index | null = null;

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const countryNames = new Intl.DisplayNames(["es"], { type: "region" });

/** Países hispanohablantes: se priorizan cuando varios lugares se llaman igual. */
const SPANISH_SPEAKING = new Set(["ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ", "AD"]);

/** Nombres en español de regiones que GeoNames da en inglés. */
const REGION_ES: Record<string, string> = {
  Andalusia: "Andalucía",
  Aragon: "Aragón",
  Asturias: "Asturias",
  "Balearic Islands": "Islas Baleares",
  "Basque Country": "País Vasco",
  "Canary Islands": "Canarias",
  Cantabria: "Cantabria",
  "Castille and León": "Castilla y León",
  "Castille-La Mancha": "Castilla-La Mancha",
  Catalonia: "Cataluña",
  Extremadura: "Extremadura",
  Galicia: "Galicia",
  "La Rioja": "La Rioja",
  Madrid: "Madrid",
  Murcia: "Murcia",
  Navarre: "Navarra",
  Valencia: "Comunidad Valenciana",
  Ceuta: "Ceuta",
  Melilla: "Melilla",
};

/** Nombres en español (o tradicionales) → nombre en la base de datos. */
const ALIASES: Record<string, string> = {
  "ciudad de mexico": "Mexico City",
  "nueva york": "New York City",
  londres: "London",
  roma: "Rome",
  paris: "Paris",
  moscu: "Moscow",
  pekin: "Beijing",
  lisboa: "Lisbon",
  bruselas: "Brussels",
  ginebra: "Geneva",
  viena: "Vienna",
  atenas: "Athens",
  estocolmo: "Stockholm",
  copenhague: "Copenhagen",
  varsovia: "Warsaw",
  praga: "Prague",
  florencia: "Florence",
  venecia: "Venice",
  napoles: "Naples",
  marsella: "Marseille",
  burdeos: "Bordeaux",
  edimburgo: "Edinburgh",
  "la haya": "The Hague",
  amberes: "Antwerpen",
  colonia: "Cologne",
  francfort: "Frankfurt am Main",
  hamburgo: "Hamburg",
  munich: "Munich",
  estambul: "Istanbul",
  "el cairo": "Cairo",
  tokio: "Tokyo",
  "nueva delhi": "New Delhi",
  filadelfia: "Philadelphia",
  "nueva orleans": "New Orleans",
  "la habana": "Havana",
  habana: "Havana",
  "ciudad de guatemala": "Guatemala City",
  "ciudad de panama": "Panamá",
  tanger: "Tangier",
  argel: "Algiers",
  tunez: "Tunis",
  jerusalen: "Jerusalem",
  berna: "Bern",
  basilea: "Basel",
  zurich: "Zürich",
  "san sebastian": "Donostia / San Sebastián",
  vitoria: "Vitoria-Gasteiz",
  castellon: "Castelló de la Plana",
  "castellon de la plana": "Castelló de la Plana",
  "la coruna": "A Coruña",
  coruna: "A Coruña",
  orense: "Ourense",
  lerida: "Lleida",
  gerona: "Girona",
  "palma de mallorca": "Palma",
};

function load(): Index {
  if (index) return index;
  const file = path.join(process.cwd(), "lib/places/places.tsv.gz");
  const text = gunzipSync(readFileSync(file)).toString("utf8");
  const lines = text.split("\n");
  const zones = lines[0].split("\t").slice(1);
  const rows: string[] = [];
  const keys: string[] = [];
  const rowOf: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const name = line.slice(0, line.indexOf("\t"));
    const r = rows.length;
    rows.push(line);
    const variants = new Set([normalize(name), ...name.split("/").map(normalize)]);
    for (const v of variants) {
      if (!v) continue;
      keys.push(v);
      rowOf.push(r);
    }
  }
  index = { keys, rowOf, rows, zones };
  return index;
}

function toPlace(row: string, zones: string[]): Place {
  const [name, admin1, country, lat, lon, zone, pop] = row.split("\t");
  const region = REGION_ES[admin1] ?? admin1;
  let countryName = country;
  try {
    countryName = countryNames.of(country) ?? country;
  } catch {
    // Código de país desconocido: se deja tal cual.
  }
  const parts = [name, region && region !== name ? region : "", countryName].filter(Boolean);
  return {
    name,
    region,
    country,
    countryName,
    label: parts.join(", "),
    latitude: Number(lat),
    longitude: Number(lon),
    timeZone: zones[Number(zone)],
    population: Number(pop),
  };
}

/** Busca lugares por nombre. Admite «ciudad, país» o «ciudad provincia». */
export function searchPlaces(query: string, limit = 10): Place[] {
  const [cityPart, ...rest] = query.split(",");
  let city = normalize(cityPart);
  const extra = normalize(rest.join(" "));
  if (city.length < 2) return [];
  const { keys, rowOf, rows, zones } = load();

  const aliasTargets = new Set<string>();
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (alias === city || (city.length >= 4 && alias.startsWith(city))) aliasTargets.add(normalize(target));
  }

  // Puntuación: grupo (0 exacto, 1 empieza por, 2 contiene) y población ponderada.
  const best = new Map<number, { group: number; weight: number }>();
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    let group = -1;
    if (k === city || aliasTargets.has(k)) group = 0;
    else if (k.startsWith(city)) group = 1;
    else if (city.length >= 4 && k.includes(city)) group = 2;
    if (group < 0) continue;
    const r = rowOf[i];
    const prev = best.get(r);
    if (!prev || group < prev.group) best.set(r, { group, weight: 0 });
  }

  let candidates = [...best.entries()].map(([r, m]) => {
    const place = toPlace(rows[r], zones);
    const weight = place.population * (SPANISH_SPEAKING.has(place.country) ? 4 : 1);
    return { place, group: m.group, weight };
  });
  if (extra) {
    const filtered = candidates.filter((c) => normalize(`${c.place.region} ${c.place.countryName} ${c.place.country}`).includes(extra));
    if (filtered.length) candidates = filtered;
  }
  candidates.sort((a, b) => a.group - b.group || b.weight - a.weight);
  return candidates.slice(0, limit).map((c) => c.place);
}

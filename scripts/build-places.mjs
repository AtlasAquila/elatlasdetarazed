// Genera lib/places/places.tsv.gz a partir de GeoNames (cities500.json, CC BY 4.0) y tz-lookup (CC0).
// Uso: node scripts/build-places.mjs ruta/a/cities500.json
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const tzlookup = require("./vendor/tz-lookup.js");

const cities = JSON.parse(readFileSync(process.argv[2], "utf8"));
cities.sort((a, b) => Number(b.pop) - Number(a.pop));
const zones = [];
const zoneIndex = new Map();
const lines = [];
for (const c of cities) {
  const lat = Number(c.lat);
  const lon = Number(c.lon);
  const tz = tzlookup(lat, lon);
  if (!zoneIndex.has(tz)) {
    zoneIndex.set(tz, zones.length);
    zones.push(tz);
  }
  const clean = (s) => String(s ?? "").replace(/[\t\n]/g, " ").trim();
  lines.push([clean(c.name), clean(c.admin1), c.country, lat.toFixed(4), lon.toFixed(4), zoneIndex.get(tz), c.pop].join("\t"));
}
writeFileSync("lib/places/places.tsv.gz", gzipSync("#zones\t" + zones.join("\t") + "\n" + lines.join("\n") + "\n", { level: 9 }));
console.log(cities.length, "lugares,", zones.length, "zonas");

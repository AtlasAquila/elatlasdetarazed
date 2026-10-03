import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deletePerson } from "@/app/actions/numerology";
import { NumerologyReading } from "@/components/NumerologyReading";
import { PersonForm } from "@/components/PersonForm";
import { PrintButton } from "@/components/PrintButton";
import { aiConfigured } from "@/lib/ai/anthropic";
import { birthSummary, listMyCharts } from "@/lib/charts";
import {
  chainText,
  computeNumerology,
  formatNumber,
  isVowel,
  lifePathDetailed,
  nameNumberDetailed,
  parseDate,
  sumCalc,
  type NumberResult,
} from "@/lib/numerology";
import { DateCalcDetail, NameCalcDetail, SumCalcDetail } from "@/components/NumerologyCalc";
import { KARMIC_DEBT_TEXT, NUMBER_MEANINGS, PERSONAL_YEAR, POSITION_INFO, SECTION_INFO, SHORT_KEYWORD, type PositionKey } from "@/lib/numerology-texts";
import { formatBirth, getMyPerson, listMyPeople, shortName } from "@/lib/people";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Numerología" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ con?: string; carta?: string; editar?: string }> };

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function NumberCard({ pos, r, calc }: { pos: PositionKey; r: NumberResult; calc?: React.ReactNode }) {
  const info = POSITION_INFO[pos];
  const m = NUMBER_MEANINGS[r.value];
  return (
    <div className="card num-card">
      <div className="num-card-intro">
        <h3>{info.name}</h3>
        <p className="small">{info.explains}</p>
        <p className="small muted num-source">
          {info.from}: {chainText(r)}
          {r.value > 9 ? ` (${formatNumber(r.value)})` : ""}
        </p>
      </div>
      <div className="num-card-head">
        <div className="num-badge">{r.value}</div>
        <div>
          <p className="kicker" style={{ marginBottom: 2 }}>
            Resultado
          </p>
          <p className="num-result-name">{m.name}</p>
          <p className="small muted" style={{ margin: 0 }}>
            {m.keywords}
          </p>
        </div>
      </div>
      <p>{m.text}</p>
      {calc}
    </div>
  );
}

function Locked({ title, text }: { title: string; text: string }) {
  return (
    <div className="card locked-card">
      <p className="kicker" style={{ marginBottom: 4 }}>
        Premium
      </p>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      <Link href="/planes" className="btn btn-ghost btn-small">
        Ver Premium
      </Link>
    </div>
  );
}

export default async function PersonPage({ params, searchParams }: Props) {
  const session = await getSession();
  const { id } = await params;
  if (!session) redirect(`/entrar?siguiente=/numerologia/${id}`);
  const person = await getMyPerson(id);
  if (!person) notFound();
  const sp = await searchParams;

  const num = computeNumerology(person.full_name, person.birth_date, person.current_name);
  const premium = session.plan === "premium" || session.isAdmin;

  const [people, charts] = await Promise.all([listMyPeople(), listMyCharts()]);
  const others = people.filter((p) => p.id !== person.id);
  const other = sp.con ? others.find((p) => p.id === sp.con) ?? null : null;

  // Carta sugerida: la que el usuario elija, la suya propia si esta persona es él, o la que coincida en fecha.
  const chart = sp.carta
    ? charts.find((c) => c.id === sp.carta) ?? null
    : (person.is_self ? charts.find((c) => c.is_self) : undefined) ?? charts.find((c) => c.birth_date === person.birth_date) ?? null;

  // Lecturas guardadas.
  let saved: { kind: string; person_id: string; other_person_id: string | null; chart_id: string | null; content: string }[] = [];
  if (premium) {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from("numerology_readings")
        .select("kind, person_id, other_person_id, chart_id, content")
        .or(`person_id.eq.${person.id},other_person_id.eq.${person.id}`);
      saved = data ?? [];
    }
  }
  const lectura = saved.find((r) => r.kind === "lectura" && r.person_id === person.id)?.content ?? null;
  const pair = other ? [person.id, other.id].sort() : null;
  const compat = pair ? saved.find((r) => r.kind === "compatibilidad" && r.person_id === pair[0] && r.other_person_id === pair[1])?.content ?? null : null;
  const cross = chart ? saved.find((r) => r.kind === "carta" && r.person_id === person.id && r.chart_id === chart.id)?.content ?? null : null;
  const ai = aiConfigured();

  const lifePathCalc = lifePathDetailed(parseDate(person.birth_date));
  const expressionCalc = nameNumberDetailed(person.full_name);
  const soulCalc = nameNumberDetailed(person.full_name, isVowel);
  const personalityCalc = nameNumberDetailed(person.full_name, (ch) => !isVowel(ch));
  const maturityCalc = sumCalc([
    { label: POSITION_INFO.lifePath.name, value: num.lifePath.value },
    { label: POSITION_INFO.expression.name, value: num.expression.value },
  ]);
  const currentNameCalc = person.current_name ? nameNumberDetailed(person.current_name) : null;

  const calcByPosition: Record<PositionKey, React.ReactNode> = {
    lifePath: <DateCalcDetail calc={lifePathCalc} />,
    expression: <NameCalcDetail calc={expressionCalc} label={POSITION_INFO.expression.name} />,
    soul: <NameCalcDetail calc={soulCalc} label={POSITION_INFO.soul.name} />,
    personality: <NameCalcDetail calc={personalityCalc} label={POSITION_INFO.personality.name} />,
    birthday: null,
    maturity: <SumCalcDetail calc={maturityCalc} label={POSITION_INFO.maturity.name} />,
    currentName: currentNameCalc ? <NameCalcDetail calc={currentNameCalc} label={POSITION_INFO.currentName.name} /> : null,
  };

  const positions: [PositionKey, NumberResult][] = [
    ["lifePath", num.lifePath],
    ["expression", num.expression],
    ["soul", num.soul],
    ["personality", num.personality],
    ["birthday", num.birthday],
    ["maturity", num.maturity],
  ];
  if (num.currentName) positions.push(["currentName", num.currentName]);

  const maxInclusion = Math.max(...num.inclusion.slice(1));

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/numerologia" className="small">
          ← Numerología
        </Link>

        <div className="print-row">
          <PrintButton />
        </div>

        <div className="chart-facts" style={{ marginTop: 20 }}>
          <div className="chart-facts-head" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 0 }}>
            <div>
              {(person.is_self || person.label) && <span className="tag">{person.is_self ? "Yo" : person.label}</span>}
              <h1 className="chart-name">{person.current_name || person.full_name}</h1>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {person.current_name ? `${person.full_name} · ` : ""}
                {formatBirth(person.birth_date)}
              </p>
            </div>
            <div className="big-three">
              {(["lifePath", "expression", "soul"] as const).map((k) => (
                <div key={k} className="big-three-item">
                  <span className="num-badge num-badge-small">{num[k].value}</span>
                  <span>
                    <span className="big-three-label">{POSITION_INFO[k].name}</span>
                    <span className="big-three-sign">{NUMBER_MEANINGS[num[k].value].name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h2 style={{ marginTop: 48 }}>Números principales</h2>
        <p className="muted section-intro">{SECTION_INFO.main}</p>
        <div className="grid-2 num-grid">
          {positions.map(([k, r]) => (
            <NumberCard key={k} pos={k} r={r} calc={calcByPosition[k]} />
          ))}
        </div>

        <div className="sheet" style={{ marginTop: 48 }}>
          <div>
            <div>
              <h3>Ciclo actual</h3>
              <p className="small muted section-intro">{SECTION_INFO.cycle}</p>
              <div className="panel">
                <p className="kicker" style={{ marginBottom: 4 }}>
                  Año personal {num.personalYear.year}
                </p>
                <p style={{ fontSize: 22, marginBottom: 6 }}>
                  <span className="num-badge num-badge-small" style={{ marginRight: 10 }}>
                    {num.personalYear.value}
                  </span>
                  {PERSONAL_YEAR[num.personalYear.value]}
                </p>
                <p className="small muted" style={{ marginBottom: 0 }}>
                  Mes personal de {MONTHS[num.personalMonth.month - 1]}: {num.personalMonth.value} · {NUMBER_MEANINGS[num.personalMonth.value].keywords.toLowerCase()}.
                </p>
                {num.personalMonth.value === num.personalYear.value && (
                  <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
                    {SECTION_INFO.cycleSame}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <div>
              <h3>Letras del nombre</h3>
              <p className="small muted section-intro">{SECTION_INFO.letters}</p>
              <div className="table-wrap">
                <table className="pos-table inclusion">
                  <tbody>
                    <tr>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <th key={n} scope="col">
                          {n}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <td key={n} data-strong={num.inclusion[n] === maxInclusion ? "true" : undefined} data-empty={num.inclusion[n] === 0 ? "true" : undefined}>
                          {num.inclusion[n]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              {num.karmicLessons.length > 0 ? (
                <>
                  <p className="kicker" style={{ marginTop: 20, marginBottom: 6 }}>
                    Lecciones kármicas
                  </p>
                  <p className="small muted" style={{ marginBottom: 8 }}>
                    {SECTION_INFO.lessons}
                  </p>
                  <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                    {num.karmicLessons.map((n) => (
                      <li key={n} className="small">
                        Falta el {n}: aprendizaje de {SHORT_KEYWORD[n]}.
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="small" style={{ marginTop: 20 }}>
                  El nombre contiene los nueve números: no hay lecciones kármicas.
                </p>
              )}
              {num.debts.length > 0 && (
                <>
                  <p className="kicker" style={{ marginTop: 20, marginBottom: 6 }}>
                    Deudas kármicas
                  </p>
                  <p className="small muted" style={{ marginBottom: 8 }}>
                    {SECTION_INFO.debts}
                  </p>
                  <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                    {num.debts.map((d) => (
                      <li key={d} className="small">
                        {KARMIC_DEBT_TEXT[d]}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="reading-block" style={{ marginTop: 64 }}>
          <p className="kicker">Lecturas de Alshain</p>
          <h2>Los números, leídos en conjunto</h2>

          {premium ? (
            <div className="num-premium">
              <div className="plate">
                <div>
                  <NumerologyReading
                    kind="lectura"
                    personId={person.id}
                    initial={lectura}
                    enabled={ai}
                    title="Lectura numerológica completa"
                    description="Una lectura extensa que relaciona todos los números entre sí: el camino de vida con los talentos, lo que se desea con lo que se muestra, las lecciones pendientes y el momento del ciclo."
                    button="Leer los números"
                  />
                </div>
              </div>

              <div className="panel">
                <h3>Compatibilidad</h3>
                {others.length === 0 ? (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Añade a otra persona a tu lista para comparar sus números con los de {shortName(person)}.
                  </p>
                ) : (
                  <>
                    <form method="get" className="inline-form">
                      {sp.carta && <input type="hidden" name="carta" value={sp.carta} />}
                      <label htmlFor="con" className="visually-hidden">
                        Persona con la que comparar
                      </label>
                      <select id="con" name="con" className="input" defaultValue={other?.id ?? ""}>
                        <option value="" disabled>
                          Elige con quién comparar
                        </option>
                        {others.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.current_name || p.full_name}
                            {p.label ? ` (${p.label})` : ""}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-ghost btn-small">
                        Comparar
                      </button>
                    </form>
                    {other && (
                      <div style={{ marginTop: 24 }} key={other.id}>
                        <NumerologyReading
                          kind="compatibilidad"
                          personId={person.id}
                          otherId={other.id}
                          initial={compat}
                          enabled={ai}
                          title={`${shortName(person)} y ${shortName(other)}`}
                          description="Cómo encajan sus caminos de vida, lo que cada uno desea y ofrece, dónde se complementan y dónde pueden chocar."
                          button="Leer la compatibilidad"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="panel">
                <h3>Numerología y carta astral</h3>
                {charts.length === 0 ? (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Para cruzar los números con el cielo necesitas una carta natal guardada. <Link href="/carta/nueva">Crea una carta</Link>.
                  </p>
                ) : (
                  <>
                    <form method="get" className="inline-form">
                      {sp.con && <input type="hidden" name="con" value={sp.con} />}
                      <label htmlFor="carta" className="visually-hidden">
                        Carta natal
                      </label>
                      <select id="carta" name="carta" className="input" defaultValue={chart?.id ?? ""}>
                        <option value="" disabled>
                          Elige una carta natal
                        </option>
                        {charts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} · {birthSummary(c)}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="btn btn-ghost btn-small">
                        Elegir
                      </button>
                    </form>
                    {chart && chart.birth_date !== person.birth_date && (
                      <p className="notice small" style={{ marginTop: 16 }}>
                        La fecha de esta carta no coincide con la de {shortName(person)}. Comprueba que sea la misma persona.
                      </p>
                    )}
                    {chart && (
                      <div style={{ marginTop: 24 }} key={chart.id}>
                        <NumerologyReading
                          kind="carta"
                          personId={person.id}
                          chartId={chart.id}
                          initial={cross}
                          enabled={ai}
                          title={`Los números y el cielo de ${chart.name}`}
                          description="Una lectura que une la numerología con la carta natal: dónde el camino de vida confirma al Sol y al Ascendente, qué matiza la Luna del número del alma, y qué ciclo personal coincide con el momento vital."
                          button="Cruzar números y carta"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid-3" style={{ marginTop: 24 }}>
              <Locked title="Lectura numerológica completa" text="Todos los números relacionados entre sí en una lectura extensa escrita por Alshain." />
              <Locked title="Compatibilidad entre personas" text="Compara los números de dos personas de tu lista: pareja, familia, socios." />
              <Locked title="Numerología y carta astral" text="Cruza los números con la carta natal guardada para una lectura conjunta." />
            </div>
          )}
        </div>

        <details className="panel" style={{ marginTop: 56 }} open={sp.editar === "1"}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Editar datos</summary>
          <div style={{ marginTop: 20 }}>
            <PersonForm person={person} />
            <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
              Si cambias el nombre o la fecha, se borran las lecturas guardadas de esta persona, porque los números cambian.
            </p>
          </div>
        </details>
        <details className="panel" style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer", color: "var(--ink-muted)" }}>Borrar a esta persona</summary>
          <form action={deletePerson} style={{ marginTop: 16 }}>
            <input type="hidden" name="id" value={person.id} />
            <p className="small muted">Se borran sus datos y todas sus lecturas.</p>
            <button type="submit" className="btn btn-ghost btn-small" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
              Borrar a {person.current_name || person.full_name}
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { ASPECTS, HOUSES, PLANETS, SIGNS, textGlyph } from "@/lib/astro";
import { getTexts } from "@/lib/texts";

export const metadata: Metadata = {
  title: "Fundamentos de la astrología",
  description: "Los principios de la astrología: signos, planetas, casas, aspectos, elementos y modalidades, y su historia desde Babilonia hasta hoy.",
};

const HISTORY = [
  {
    when: "II milenio a. C.",
    title: "Mesopotamia: el cielo como mensaje",
    text: "Los escribas babilonios registran presagios celestes durante siglos. La gran compilación Enūma Anu Enlil reúne miles de ellos: eclipses, fases de la Luna y posiciones de Venus leídos como avisos para el rey y el reino.",
  },
  {
    when: "Siglo V a. C.",
    title: "Nace el zodiaco de doce signos",
    text: "En Babilonia se divide la franja del cielo por la que pasan el Sol y los planetas en doce sectores iguales de 30°. De esa época datan los horóscopos personales más antiguos que se conservan.",
  },
  {
    when: "Siglos II a. C. – I d. C.",
    title: "Egipto helenístico: la astrología horoscópica",
    text: "En Alejandría se funden las tradiciones babilónica, egipcia y griega. Aparecen el Ascendente, las doce casas y los aspectos: la estructura de la carta natal que seguimos usando.",
  },
  {
    when: "Siglo II d. C.",
    title: "Ptolomeo y el Tetrabiblos",
    text: "Claudio Ptolomeo escribe en Alejandría el Tetrabiblos, el tratado que ordenó la astrología durante más de mil años.",
  },
  {
    when: "Siglos VIII – X",
    title: "Bagdad y el mundo islámico",
    text: "Astrónomos y astrólogos persas y árabes, como Abu Ma'shar, traducen, conservan y amplían el saber griego.",
  },
  {
    when: "Siglos XII – XIII",
    title: "Toledo, puente hacia Europa",
    text: "Las traducciones del árabe al latín hechas en la península ibérica devuelven la astrología a Europa, donde se estudia en universidades y cortes.",
  },
  {
    when: "Siglo XX",
    title: "La astrología psicológica",
    text: "Autores como Dane Rudhyar reinterpretan la carta natal como un mapa de la personalidad y del crecimiento interior, el enfoque que predomina hoy.",
  },
];

const ELEMENTS = [
  { name: "Fuego", signs: "Aries, Leo, Sagitario", text: "Entusiasmo, acción, inspiración." },
  { name: "Tierra", signs: "Tauro, Virgo, Capricornio", text: "Realismo, constancia, cuerpo." },
  { name: "Aire", signs: "Géminis, Libra, Acuario", text: "Ideas, palabra, relación." },
  { name: "Agua", signs: "Cáncer, Escorpio, Piscis", text: "Emoción, intuición, vínculo." },
];

const MODALITIES = [
  { name: "Cardinal", signs: "Aries, Cáncer, Libra, Capricornio", text: "Inician. Abren cada estación del año." },
  { name: "Fija", signs: "Tauro, Leo, Escorpio, Acuario", text: "Sostienen. Dan continuidad y firmeza." },
  { name: "Mutable", signs: "Géminis, Virgo, Sagitario, Piscis", text: "Adaptan. Cierran las estaciones y preparan el cambio." },
];

export default async function FundamentosPage() {
  const { t } = await getTexts();
  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <p className="kicker">Fundamentos de la astrología</p>
            <h1>Cómo se lee el cielo</h1>
            <p className="lead">Signos, planetas, casas y aspectos: las piezas con las que se construye una carta, y la historia de tres mil años que hay detrás.</p>
          </div>
        </div>
      </section>

      <section className="section" id="pilares" style={{ borderTop: 0 }}>
        <div className="container">
          <p className="kicker">Los cuatro pilares</p>
          <h2>Cómo se lee una carta</h2>
          <div className="grid-4" style={{ marginTop: 32 }}>
            <div className="card">
              <h3>Planetas</h3>
              <p className="muted">Qué energía actúa: la voluntad, la emoción, la mente, el deseo…</p>
            </div>
            <div className="card">
              <h3>Signos</h3>
              <p className="muted">Cómo se expresa esa energía: con impulso, con calma, con curiosidad…</p>
            </div>
            <div className="card">
              <h3>Casas</h3>
              <p className="muted">En qué área de la vida se manifiesta: el hogar, la pareja, la vocación…</p>
            </div>
            <div className="card">
              <h3>Aspectos</h3>
              <p className="muted">Cómo dialogan los planetas entre sí: en armonía o en tensión.</p>
            </div>
          </div>
          <p className="lead" style={{ marginTop: 32 }}>
            Por ejemplo, <em>Venus en Tauro en la casa VII</em>: el amor (Venus), vivido con calma y constancia (Tauro), en la pareja (casa VII).
          </p>
        </div>
      </section>

      <section className="section" id="signos">
        <div className="container">
          <p className="kicker">El zodiaco</p>
          <h2>Los doce signos</h2>
          <p className="lead reading">{t("intro.signs.lead")}</p>
          <div className="table-wrap" style={{ marginTop: 24 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Signo</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Elemento</th>
                  <th scope="col">Modalidad</th>
                  <th scope="col">Regente</th>
                  <th scope="col">Claves</th>
                </tr>
              </thead>
              <tbody>
                {SIGNS.map((s) => (
                  <tr key={s.name}>
                    <td>
                      <span className="sym" aria-hidden="true">
                        {textGlyph(s.glyph)}
                      </span>{" "}
                      {s.name}
                    </td>
                    <td>{s.dates}</td>
                    <td>{s.element}</td>
                    <td>{s.modality}</td>
                    <td>{s.ruler}</td>
                    <td className="muted">{s.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="elementos">
        <div className="container grid-2">
          <div>
            <p className="kicker">Elementos</p>
            <h2>Cuatro temperamentos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {ELEMENTS.map((e) => (
                <div key={e.name} className="card">
                  <h3>{e.name}</h3>
                  <p className="muted small" style={{ marginBottom: 4 }}>
                    {e.signs}
                  </p>
                  <p>{e.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="kicker">Modalidades</p>
            <h2>Tres ritmos</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
              {MODALITIES.map((m) => (
                <div key={m.name} className="card">
                  <h3>{m.name}</h3>
                  <p className="muted small" style={{ marginBottom: 4 }}>
                    {m.signs}
                  </p>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="planetas">
        <div className="container">
          <p className="kicker">Los planetas</p>
          <h2>Diez voces en el cielo</h2>
          <p className="lead reading">{t("intro.planets.lead")}</p>
          <div className="grid-3" style={{ marginTop: 24 }}>
            {PLANETS.map((p) => (
              <div key={p.name} className="card">
                <span className="glyph" aria-hidden="true">
                  {textGlyph(p.glyph)}
                </span>
                <h3>{p.name}</h3>
                <p>{p.meaning}</p>
                <p className="muted small">Ciclo: {p.cycle.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="casas">
        <div className="container">
          <p className="kicker">Las casas</p>
          <h2>Doce escenarios de la vida</h2>
          <p className="lead reading">{t("intro.houses.lead")}</p>
          <div className="grid-3" style={{ marginTop: 32 }}>
            {HOUSES.map((h) => (
              <div key={h.number} className="card">
                <span className="glyph" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 40 }}>
                  {h.number}
                </span>
                <h3>{h.title}</h3>
                <p className="muted">{h.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="lecturas-planetas">
        <div className="container">
          <p className="kicker">Planetas en signos</p>
          <h2>Próximas lecturas</h2>
          <p className="lead reading">Cada planeta tendrá su lectura en los doce signos y en las doce casas.</p>
          <div className="grid-4" style={{ marginTop: 24 }}>
            {PLANETS.map((p) => (
              <div key={p.name} className="card">
                <span className="glyph" aria-hidden="true">
                  {textGlyph(p.glyph)}
                </span>
                <h3>{p.name}</h3>
                <p className="muted small">12 signos · 12 casas</p>
                <span className="tag" style={{ marginBottom: 0 }}>
                  En preparación
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="aspectos">
        <div className="container">
          <p className="kicker">Los aspectos</p>
          <h2>El diálogo entre planetas</h2>
          <p className="lead reading">{t("intro.aspects.lead")}</p>
          <div className="table-wrap" style={{ marginTop: 24 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Aspecto</th>
                  <th scope="col">Ángulo</th>
                  <th scope="col">Naturaleza</th>
                  <th scope="col">Significado</th>
                </tr>
              </thead>
              <tbody>
                {ASPECTS.map((a) => (
                  <tr key={a.name}>
                    <td>{a.name}</td>
                    <td>{a.angle}</td>
                    <td>{a.nature}</td>
                    <td className="muted">{a.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="historia">
        <div className="container reading">
          <p className="kicker">Historia</p>
          <h2>{t("intro.history.title")}</h2>
          <ol className="timeline" style={{ marginTop: 32 }}>
            {HISTORY.map((h) => (
              <li key={h.when}>
                <span className="when">{h.when}</span>
                <h3>{h.title}</h3>
                <p className="muted">{h.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

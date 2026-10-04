import type { CicloLunar as Ciclo } from "@/lib/clima/ciclo-actual";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaUtc(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return { dia: `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`, hora: `${hh}:${mm}` };
}

/** Línea de tiempo del ciclo lunar, de Luna llena a Luna llena (horas en UTC). */
export function CicloLunar({ ciclo }: { ciclo: Ciclo }) {
  return (
    <div className="ciclo">
      <p className="ciclo-kicker">Ciclo lunar</p>
      <h2 className="ciclo-titulo">{ciclo.titulo}</h2>
      <p className="ciclo-periodo">{ciclo.periodo}</p>
      <p className="ciclo-utc">Todas las horas en UTC</p>

      <div className="ciclo-lunas" aria-hidden="true">
        {ciclo.lunas.map((l, i) => (
          <div key={l.fecha} className="ciclo-luna-wrap">
            {i > 0 && <span className="ciclo-barra" />}
            <div className="ciclo-luna">
              <span className={`ciclo-disco ${l.fase}`} />
              <span className="ciclo-luna-fecha">{l.fecha}</span>
              <span className="ciclo-luna-signo">{l.signo}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ciclo-activos">
        {ciclo.activos.map((a) => (
          <span key={a} className="ciclo-chip">{a}</span>
        ))}
      </div>

      <ol className="ciclo-lista">
        {ciclo.eventos.map((e) => {
          const f = fechaUtc(e.utc);
          return (
            <li key={e.utc + e.titulo} className={e.tipo ? `ciclo-ev ${e.tipo}` : "ciclo-ev"}>
              <time className="ciclo-fecha" dateTime={e.utc}>
                <b>{f.dia}</b>
                <span>{f.hora}</span>
              </time>
              <span className="ciclo-punto glyph-font" aria-hidden="true">{e.glifo + "︎"}</span>
              <div>
                <h3>
                  {e.titulo} {e.grado && <span className="ciclo-grado">{e.grado}</span>}
                  {e.tipo === "clave" && <span className="ciclo-tag">clave</span>}
                </h3>
                <p>{e.texto}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="ciclo-pie">Calculado con el motor de El atlas de Tarazed · Se renueva en cada Luna llena</p>
    </div>
  );
}

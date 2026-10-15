import { RichText } from "@/components/RichText";
import { climaDayLabel, type ClimaDia } from "@/lib/clima-diario";

/** La lectura del clima astral de un día: fecha, titular, cielo del día (✦), texto y cierre. */
export function ClimaDiaCard({ reading }: { reading: ClimaDia }) {
  return (
    <article className="clima-dia">
      <p className="clima-dia-fecha">
        <span aria-hidden="true">{reading.icon}</span> {climaDayLabel(reading.day)}
      </p>
      <h2 className="clima-dia-titular">{reading.headline}</h2>
      {reading.tags.length > 0 && (
        <ul className="clima-dia-cielo">
          {reading.tags.map((t) => (
            <li key={t}>✦ {t}</li>
          ))}
        </ul>
      )}
      <RichText text={reading.body} />
      {reading.closing && <p className="clima-dia-cierre">→ {reading.closing}</p>}
    </article>
  );
}

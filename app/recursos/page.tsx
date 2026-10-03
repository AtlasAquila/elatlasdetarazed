import type { Metadata } from "next";
import Link from "next/link";
import { getTexts } from "@/lib/texts";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Más recursos astrológicos",
  description: "Revolución solar, sinastría, tránsitos planetarios y retorno de Saturno: las técnicas de El atlas de Tarazed.",
};

const RESOURCES = [
  {
    name: "Revolución solar",
    text: "La carta calculada para el instante exacto en que el Sol vuelve a tu grado natal cada año, en el lugar donde te encuentres. Señala los temas que dominarán el año que empieza en tu cumpleaños.",
    href: "/carta",
  },
  {
    name: "Sinastría",
    text: "La comparación entre dos cartas natales: cómo dialogan tus planetas con los de otra persona, en la pareja, la familia o el trabajo.",
    href: "/sinastria",
  },
  {
    name: "Tránsitos planetarios",
    text: "Las posiciones actuales de los planetas comparadas con tu carta natal, para entender qué activa el cielo de hoy en tu vida.",
  },
  {
    name: "Retorno de Saturno",
    text: "El momento, hacia los 29 años y de nuevo hacia los 58, en que Saturno regresa a su posición de nacimiento: una etapa de maduración, responsabilidad y balance.",
  },
];

export default async function RecursosPage() {
  const { t } = await getTexts();
  const session = await getSession();
  let isPremium = false;
  if (session) {
    const supabase = await createClient();
    const { data: profile } = supabase ? await supabase.from("profiles").select("plan").eq("id", session.userId).maybeSingle() : { data: null };
    isPremium = profile?.plan === "premium";
  }

  return (
    <>
      <section className="hero">
        <div className="container reading">
          <p className="kicker">Más recursos astrológicos</p>
          <h1>{t("recursos.title")}</h1>
          <p className="lead">{t("recursos.lead")}</p>
        </div>
      </section>

      <section className="section" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="container">
          <div className="grid-4">
            {RESOURCES.map((r) => (
              <div key={r.name} className="card">
                <h3>{r.name}</h3>
                <p className="muted">{r.text}</p>
                {r.href ? (
                  isPremium ? (
                    <Link href={r.href} className="tag" style={{ marginBottom: 0 }}>
                      Disponible
                    </Link>
                  ) : (
                    <Link href="/planes" className="tag" style={{ marginBottom: 0 }}>
                      Hazte premium
                    </Link>
                  )
                ) : (
                  <span className="tag" style={{ marginBottom: 0 }}>
                    En preparación
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

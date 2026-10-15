import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fmtDateTime } from "@/lib/admin";
import { ROMAN, SIGN_NAMES } from "@/lib/engine/labels";
import { createClient, getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Guía de Plutón · Panel" };
export const dynamic = "force-dynamic";

type Peticion = {
  id: string;
  created_at: string;
  nombre: string | null;
  email: string | null;
  birth_date: string;
  birth_time: string;
  place_name: string;
  ascendente: number | null;
  casa_estacion: number | null;
  secciones_ia: number | null;
};

/** 1990-03-07 → 07/03/1990 (sin pasar por Date, para que la zona horaria no mueva el día). */
const fechaNacimiento = (iso: string) => iso.split("-").reverse().join("/");

export default async function AdminPlutonPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const { data } = await supabase
    .from("pluton_guia")
    .select("id, created_at, nombre, email, birth_date, birth_time, place_name, ascendente, casa_estacion, secciones_ia")
    .order("created_at", { ascending: false });
  const peticiones = (data as Peticion[] | null) ?? [];
  const sinIa = peticiones.filter((p) => p.secciones_ia !== null && p.secciones_ia < 3).length;

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de administración
        </p>
        <h1>Guía de Plutón directo en Acuario</h1>
        <p className="lead">
          {peticiones.length === 1 ? "Una persona ha pedido" : `${peticiones.length} personas han pedido`} saber en qué casa de su carta se mueve Plutón.
          {sinIa > 0 && ` En ${sinIa} ${sinIa === 1 ? "guía" : "guías"} la IA no escribió las tres secciones y salió el texto de reserva.`}
        </p>

        {peticiones.length === 0 ? (
          <p className="muted">Nadie ha pedido la guía todavía.</p>
        ) : (
          <div className="table-wrap">
            <table className="pos-table admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Nacimiento</th>
                  <th>Ascendente</th>
                  <th>Casa de la estación</th>
                  <th>Secciones de IA</th>
                </tr>
              </thead>
              <tbody>
                {peticiones.map((p) => (
                  <tr key={p.id}>
                    <td className="small" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(p.created_at)}</td>
                    <td>{p.nombre ?? "—"}</td>
                    <td>{p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : "—"}</td>
                    <td className="small">
                      {fechaNacimiento(p.birth_date)} · {p.birth_time.slice(0, 5)}
                      <div className="muted">{p.place_name}</div>
                    </td>
                    <td>{p.ascendente === null ? "—" : SIGN_NAMES[p.ascendente]}</td>
                    <td>{p.casa_estacion === null ? "—" : `Casa ${ROMAN[p.casa_estacion - 1]}`}</td>
                    <td>{p.secciones_ia === null ? "—" : `${p.secciones_ia} de 3`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted" style={{ marginTop: 12 }}>
          El nombre y el correo son opcionales. El correo solo está si la persona marcó recibir la guía por correo: úsalo solo para eso y bórralo si te lo piden. «Secciones de IA» dice cuántas de las tres secciones personalizadas escribió la IA; con menos de 3, el resto salió con el texto de reserva.
        </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fmtDateTime } from "@/lib/admin";
import { SIGN_NAMES } from "@/lib/engine/labels";
import { createClient, getSession } from "@/lib/supabase/server";
import { ROMAN } from "@/lib/venus-guia";

export const metadata: Metadata = { title: "Guía de Venus · Panel" };
export const dynamic = "force-dynamic";

type Peticion = {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  birth_date: string;
  birth_time: string;
  place_name: string;
  ascendente: number | null;
  casa_luna_nueva: number | null;
};

/** 1990-03-07 → 07/03/1990 (sin pasar por Date, para que la zona horaria no mueva el día). */
const fechaNacimiento = (iso: string) => iso.split("-").reverse().join("/");

export default async function AdminVenusPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/cuenta");
  const supabase = await createClient();
  if (!supabase) redirect("/");

  const { data } = await supabase
    .from("venus_guia")
    .select("id, created_at, nombre, email, birth_date, birth_time, place_name, ascendente, casa_luna_nueva")
    .order("created_at", { ascending: false });
  const peticiones = (data as Peticion[] | null) ?? [];

  return (
    <section className="chart-page">
      <div className="container">
        <Link href="/admin" className="small">
          ← Panel
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Panel de administración
        </p>
        <h1>Guía de Venus retrógrado</h1>
        <p className="lead">
          {peticiones.length === 1 ? "Una persona ha pedido" : `${peticiones.length} personas han pedido`} saber en qué casa de su carta cae la Luna Nueva.
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
                  <th>Casa de la Luna Nueva</th>
                </tr>
              </thead>
              <tbody>
                {peticiones.map((p) => (
                  <tr key={p.id}>
                    <td className="small" style={{ whiteSpace: "nowrap" }}>{fmtDateTime(p.created_at)}</td>
                    <td>{p.nombre}</td>
                    <td>
                      <a href={`mailto:${p.email}`}>{p.email}</a>
                    </td>
                    <td className="small">
                      {fechaNacimiento(p.birth_date)} · {p.birth_time.slice(0, 5)}
                      <div className="muted">{p.place_name}</div>
                    </td>
                    <td>{p.ascendente === null ? "—" : SIGN_NAMES[p.ascendente]}</td>
                    <td>{p.casa_luna_nueva === null ? "—" : `Casa ${ROMAN[p.casa_luna_nueva - 1]}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted" style={{ marginTop: 12 }}>
          Son datos personales que dieron su permiso para recibir la guía: úsalos solo para eso y bórralos si te lo piden.
        </p>
      </div>
    </section>
  );
}

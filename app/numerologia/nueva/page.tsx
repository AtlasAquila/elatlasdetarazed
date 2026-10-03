import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/PersonForm";
import { NUMEROLOGY_PEOPLE_LIMIT, listMyPeople } from "@/lib/people";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Añadir persona · Numerología" };

export default async function NuevaPersonaPage() {
  const session = await getSession();
  if (!session) redirect("/entrar?siguiente=/numerologia/nueva");
  const people = await listMyPeople();
  if (people.length >= NUMEROLOGY_PEOPLE_LIMIT) redirect("/numerologia");

  return (
    <section className="hero">
      <div className="container reading">
        <Link href="/numerologia" className="small">
          ← Numerología
        </Link>
        <p className="kicker" style={{ marginTop: 24 }}>
          Añadir persona
        </p>
        <h1>Nombre y fecha</h1>
        <p className="lead">La numerología parte del nombre que se dio al nacer. Si esa persona usa hoy otro nombre, puedes añadirlo también.</p>
        <div className="panel" style={{ marginTop: 24 }}>
          <PersonForm suggestSelf={!people.some((p) => p.is_self)} />
        </div>
      </div>
    </section>
  );
}

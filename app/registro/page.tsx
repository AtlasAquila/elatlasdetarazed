import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Crear cuenta" };

type Props = { searchParams: Promise<{ siguiente?: string }> };

export default async function RegistroPage({ searchParams }: Props) {
  const { siguiente } = await searchParams;
  const next = siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : undefined;
  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Gratis</p>
        <h1 style={{ fontSize: 44 }}>Crea tu cuenta</h1>
        <p className="muted">Guarda tus cartas natales y obtén gratis una lectura completa de ellas.</p>
        <SignUpForm next={next} />
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          ¿Ya tienes cuenta? <Link href={next ? `/entrar?siguiente=${encodeURIComponent(next)}` : "/entrar"}>Entra</Link>
        </p>
      </div>
    </div>
  );
}

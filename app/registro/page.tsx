import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Gratis</p>
        <h1 style={{ fontSize: 44 }}>Crea tu cuenta</h1>
        <p className="muted">Guarda tus cartas natales y recibe el aviso del lanzamiento.</p>
        <SignUpForm />
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          ¿Ya tienes cuenta? <Link href="/entrar">Entra</Link>
        </p>
      </div>
    </div>
  );
}

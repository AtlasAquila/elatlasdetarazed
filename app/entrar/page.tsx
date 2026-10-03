import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ siguiente?: string; error?: string }> };

export default async function EntrarPage({ searchParams }: Props) {
  const { siguiente, error } = await searchParams;
  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Tu cuenta</p>
        <h1 style={{ fontSize: 44 }}>Entrar</h1>
        {error && (
          <p className="notice notice-error" role="alert">
            El enlace ha caducado o no es válido. Vuelve a intentarlo.
          </p>
        )}
        <SignInForm next={siguiente} />
        <p className="small muted" style={{ marginTop: 24, marginBottom: 0 }}>
          ¿No tienes cuenta? <Link href="/registro">Créala gratis</Link>
        </p>
      </div>
    </div>
  );
}

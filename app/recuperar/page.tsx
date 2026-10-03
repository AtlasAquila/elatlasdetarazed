import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Tu cuenta</p>
        <h1 style={{ fontSize: 44 }}>Recuperar contraseña</h1>
        <p className="muted">Te enviaremos un enlace para crear una contraseña nueva.</p>
        <ResetRequestForm />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { NewPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function NuevaContrasenaPage() {
  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Tu cuenta</p>
        <h1 style={{ fontSize: 44 }}>Nueva contraseña</h1>
        <NewPasswordForm />
      </div>
    </div>
  );
}

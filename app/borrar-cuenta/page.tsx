import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cómo borrar tu cuenta",
  description: "Cómo borrar tu cuenta de Códice Orbital y todos tus datos, desde la web, la aplicación de Android o por correo.",
};

export default function BorrarCuentaPage() {
  return (
    <LegalPage title="Cómo borrar tu cuenta" updated="15 de octubre de 2026">
      <p>Puedes borrar tu cuenta de Códice Orbital y todos los datos asociados cuando quieras. Es inmediato y no se puede deshacer.</p>

      <h2>Desde la web o la aplicación de Android</h2>
      <ol>
        <li>
          Entra en tu cuenta y abre <Link href="/cuenta">Mi cuenta</Link> (en la aplicación, la pestaña «Cuenta»).
        </li>
        <li>Al final de la página, despliega «Borrar mi cuenta».</li>
        <li>Escribe BORRAR y pulsa «Borrar mi cuenta».</li>
      </ol>

      <h2>Por correo</h2>
      <p>Si no puedes entrar, escribe a elatlasdetarazed@gmail.com desde el correo de tu cuenta y la borraremos a mano.</p>

      <h2>Qué se borra</h2>
      <ul>
        <li>Tu cuenta: correo, nombre y contraseña.</li>
        <li>Tus cartas natales, tus lecturas y tus conversaciones con el asistente.</li>
        <li>Las personas y lecturas de numerología que hayas guardado.</li>
        <li>Tus avisos, los reportes que hayas enviado y los dispositivos registrados para recibir avisos en el móvil.</li>
        <li>Si tenías una suscripción, se cancela antes de borrar la cuenta.</li>
      </ul>
      <p>
        Más información sobre cómo tratamos tus datos en la <Link href="/privacidad">política de privacidad</Link>.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { confirmEmailLink } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Confirmar cuenta" };

type Props = {
  searchParams: Promise<{ token_hash?: string; type?: string; code?: string; next?: string }>;
};

/**
 * Destino del enlace de los correos (confirmar cuenta, recuperar contraseña).
 * A propósito no confirma nada al abrirla: solo muestra un botón. La confirmación
 * real ocurre en confirmEmailLink (server action), que se dispara con el POST del
 * formulario al pulsar el botón, no con la simple visita (GET) al enlace. Así, si
 * Gmail/Outlook abren el enlace por su cuenta para escanearlo en busca de phishing,
 * no consumen el código de un solo uso antes de que llegue la persona real.
 */
export default async function ConfirmarPage({ searchParams }: Props) {
  const { token_hash, type, code, next } = await searchParams;
  const valid = Boolean((token_hash && type) || code);

  return (
    <div className="container">
      <div className="auth-wrap panel">
        <p className="kicker">Tu cuenta</p>
        <h1 style={{ fontSize: 40 }}>Confirma tu cuenta</h1>
        {valid ? (
          <>
            <p className="muted">Pulsa el botón para terminar de activar tu cuenta y entrar.</p>
            <form action={confirmEmailLink}>
              <input type="hidden" name="token_hash" value={token_hash ?? ""} />
              <input type="hidden" name="type" value={type ?? ""} />
              <input type="hidden" name="code" value={code ?? ""} />
              <input type="hidden" name="next" value={next ?? "/cuenta"} />
              <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                Confirmar y entrar
              </button>
            </form>
          </>
        ) : (
          <p className="notice notice-error" role="alert">
            El enlace no es válido. Vuelve a intentarlo desde el correo original.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteAccount,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  updateProfile,
  type AuthState,
} from "@/app/actions/auth";

function Feedback({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p className="notice notice-error" role="alert">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p className="notice notice-ok" role="status">
        {state.message}
      </p>
    );
  return null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="form">
      <input type="hidden" name="siguiente" value={next ?? "/cuenta"} />
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="small muted" style={{ margin: 0 }}>
        <Link href="/recuperar">¿Has olvidado tu contraseña?</Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, {});
  if (state.message) return <Feedback state={state} />;
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="name">Nombre (opcional)</label>
        <input id="name" name="name" type="text" autoComplete="given-name" className="input" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña (mínimo 8 caracteres)</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <label className="check">
        <input type="checkbox" name="terms" required />
        <span>
          He leído y acepto la <Link href="/privacidad">política de privacidad</Link> y el <Link href="/aviso-legal">aviso legal</Link>.
        </span>
      </label>
      <Feedback state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  if (state.message) return <Feedback state={state} />;
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  if (state.message)
    return (
      <div className="form">
        <Feedback state={state} />
        <Link href="/cuenta" className="btn btn-primary">
          Ir a mi cuenta
        </Link>
      </div>
    );
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="password">Contraseña nueva</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div className="field">
        <label htmlFor="repeat">Repítela</label>
        <input id="repeat" name="repeat" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updateProfile, {});
  return (
    <form action={action} className="form">
      <div className="field">
        <label htmlFor="name">Nombre</label>
        <input id="name" name="name" type="text" defaultValue={name} maxLength={80} className="input" />
      </div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: "flex-start" }}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="form">
      <p className="muted" style={{ margin: 0 }}>
        Se borrarán tu cuenta, tus cartas y tus conversaciones. No se puede deshacer.
      </p>
      <div className="field">
        <label htmlFor="confirm">Escribe BORRAR para confirmar</label>
        <input id="confirm" name="confirm" type="text" autoComplete="off" className="input" style={{ maxWidth: 260 }} />
      </div>
      <Feedback state={state} />
      <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: "flex-start", borderColor: "var(--error)", color: "var(--error)" }}>
        {pending ? "Borrando…" : "Borrar mi cuenta"}
      </button>
    </form>
  );
}

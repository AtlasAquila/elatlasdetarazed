import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de cookies" };

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>El atlas de Tarazed solo usa cookies técnicas, necesarias para mantener tu sesión iniciada. No usamos cookies de análisis ni de publicidad, por lo que no es necesario pedir tu consentimiento.</p>
      <p>Si en el futuro añadimos cookies de análisis, te pediremos permiso antes de activarlas y actualizaremos esta página.</p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad">
      <h2>Responsable</h2>
      <p>[NOMBRE Y APELLIDOS O RAZÓN SOCIAL], NIF [NIF], [DIRECCIÓN], [CORREO].</p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Datos de la cuenta: correo electrónico, nombre (opcional) y contraseña cifrada.</li>
        <li>Datos de nacimiento que introduzcas para calcular cartas: fecha, hora y lugar.</li>
        <li>Nombres completos y fechas de nacimiento que introduzcas para la numerología, tuyos o de otras personas. Si añades a terceros, te corresponde contar con su conocimiento; puedes borrar a cualquier persona en todo momento y se eliminan sus datos y lecturas.</li>
        <li>Los sueños que anotes en tu diario, con las emociones que marques, y sus interpretaciones. Pueden contener información muy personal: solo tú puedes verlos, solo se usan para interpretarlos dentro de tu diario y puedes borrarlos uno a uno o todos a la vez, con efecto inmediato.</li>
        <li>Conversaciones con el asistente astrológico, para que pueda recordar el contexto. El responsable de la web puede revisar las preguntas y respuestas para mejorar la calidad del asistente y detectar usos indebidos; no se usan para ningún otro fin.</li>
        <li>Correo de la lista de espera, si te apuntas.</li>
      </ul>
      <h2>Para qué</h2>
      <p>Para prestarte el servicio (calcular e interpretar tus cartas, guardar tu historial) y, si te apuntas a la lista de espera, para avisarte del lanzamiento. No vendemos tus datos ni los usamos para publicidad.</p>
      <h2>Base legal</h2>
      <p>La ejecución del servicio que solicitas al crear tu cuenta y tu consentimiento para la lista de espera, que puedes retirar en cualquier momento.</p>
      <h2>Dónde se guardan</h2>
      <p>En servidores de Supabase ubicados en la Unión Europea (París). La web se sirve a través de Vercel. Las interpretaciones se generan con la API de Anthropic. [COMPLETAR CON LAS GARANTÍAS DE CADA PROVEEDOR ANTES DEL LANZAMIENTO.]</p>
      <h2>Cuánto tiempo</h2>
      <p>Mientras mantengas tu cuenta. Puedes borrarla, con todos sus datos, desde «Mi cuenta».</p>
      <h2>Tus derechos</h2>
      <p>Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos escribiendo a [CORREO]. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    </LegalPage>
  );
}

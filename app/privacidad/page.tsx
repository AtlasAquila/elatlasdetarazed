import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="15 de octubre de 2026">
      <h2>Responsable</h2>
      <p>Ferran Terol Romero, NIF 79274302H, C/ Anselm Clavé, 12, 08130 Santa Perpètua de Mogoda (Barcelona), elatlasdetarazed@gmail.com.</p>
      <h2>Qué datos tratamos</h2>
      <ul>
        <li>Datos de la cuenta: correo electrónico, nombre (opcional) y contraseña cifrada.</li>
        <li>Datos de nacimiento que introduzcas para calcular cartas: fecha, hora y lugar.</li>
        <li>Nombres completos y fechas de nacimiento que introduzcas para la numerología, tuyos o de otras personas. Si añades a terceros, te corresponde contar con su conocimiento; puedes borrar a cualquier persona en todo momento y se eliminan sus datos y lecturas.</li>
        <li>Conversaciones con el asistente astrológico, para que pueda recordar el contexto. El responsable de la web puede revisar las preguntas y respuestas para mejorar la calidad del asistente y detectar usos indebidos; no se usan para ningún otro fin.</li>
        <li>
          Si usas la aplicación de Android y activas los avisos: un identificador de tu dispositivo (token de Firebase Cloud Messaging), tus preferencias de avisos y los avisos que te enviamos (el clima astral semanal y los
          tránsitos importantes de tu carta), que se guardan en la pestaña «Reportes» de la aplicación. Puedes desactivarlos en cualquier momento desde «Mi cuenta».
        </li>
        <li>Los reportes que envíes sobre un texto generado por inteligencia artificial: el texto reportado, el motivo y tu comentario. Los revisa el responsable para corregir y mejorar el servicio.</li>
        <li>Correo de la lista de espera, si te apuntas.</li>
        <li>Datos de nacimiento (fecha, hora y lugar) que envíes para recibir la guía gratuita de la campaña «Venus retrógrado»; sirven para calcular tu ascendente. Tu nombre y tu correo son opcionales: el correo solo se guarda si marcas la casilla de recibir también la guía por correo, y solo se usa para enviártela.</li>
        <li>Datos de nacimiento (fecha, hora y lugar) que envíes para recibir la guía gratuita de la campaña «Plutón directo en Acuario»; sirven para calcular tus casas y los puntos de tu carta que Plutón toca. Para redactar la guía se envían a Anthropic, sin tu nombre ni tu correo. Tu nombre y tu correo son opcionales: el correo solo se guarda si marcas la casilla de recibir también la guía por correo, y solo se usa para enviártela.</li>
      </ul>
      <h2>Para qué</h2>
      <p>Para prestarte el servicio (calcular e interpretar tus cartas, guardar tu historial), para enviarte la guía si la pides y, si te apuntas a la lista de espera, para avisarte del lanzamiento. No vendemos tus datos ni los usamos para publicidad.</p>
      <h2>Base legal</h2>
      <p>La ejecución del servicio que solicitas al crear tu cuenta y tu consentimiento para la lista de espera y para la guía gratuita, que puedes retirar en cualquier momento.</p>
      <h2>Dónde se guardan</h2>
      <p>Tus datos se guardan en servidores de Supabase ubicados en la Unión Europea (París). Para prestar el servicio trabajamos con estos encargados del tratamiento, que solo usan los datos para lo que les pedimos:</p>
      <ul>
        <li><strong>Supabase</strong>: base de datos y cuentas de usuario (UE).</li>
        <li><strong>Vercel</strong>: alojamiento de la web.</li>
        <li><strong>Anthropic</strong>: genera las interpretaciones y las respuestas del asistente a partir de los datos de tus cartas. No usa esos datos para entrenar sus modelos.</li>
        <li><strong>Stripe</strong>: gestiona los pagos de Premium y de las lecturas. Nosotros no vemos ni guardamos los datos de tu tarjeta.</li>
        <li><strong>Google (Firebase Cloud Messaging)</strong>: entrega al móvil los avisos de la aplicación de Android.</li>
        <li><strong>Resend</strong>: envía los correos de la cuenta (confirmación y recuperar contraseña) y la guía gratuita.</li>
      </ul>
      <p>Algunos de estos proveedores están en Estados Unidos. Las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo aprobadas por la Comisión Europea.</p>
      <h2>Cuánto tiempo</h2>
      <p>Mientras mantengas tu cuenta. Puedes borrarla, con todos sus datos, desde «Mi cuenta».</p>
      <h2 id="borrar-cuenta">Cómo borrar tu cuenta</h2>
      <p>
        Puedes borrar tu cuenta y todos tus datos tú mismo, en la web o en la aplicación: entra en «Mi cuenta», abre «Borrar mi cuenta» y escribe BORRAR. Se eliminan tu cuenta, tus cartas, tus conversaciones, tus lecturas,
        tus avisos y los dispositivos registrados para recibirlos. Si no puedes entrar, escribe a elatlasdetarazed@gmail.com desde el correo de tu cuenta y la borramos. Hay más detalles en{" "}
        <a href="/borrar-cuenta">cómo borrar tu cuenta</a>.
      </p>
      <h2>Tus derechos</h2>
      <p>Puedes acceder, rectificar, suprimir, oponerte, limitar el tratamiento y solicitar la portabilidad de tus datos escribiendo a elatlasdetarazed@gmail.com. También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>
    </LegalPage>
  );
}

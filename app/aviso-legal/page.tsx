import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Aviso legal" };

export default function AvisoLegalPage() {
  return (
    <LegalPage title="Aviso legal">
      <h2>Titular</h2>
      <p>
        En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información (LSSI-CE), se informa de que este sitio web, elatlasdetarazed.com, es titularidad de Ferran Terol Romero, con NIF 79274302H, domicilio en C/ Anselm Clavé, 12, 08130 Santa Perpètua de Mogoda (Barcelona) y correo de contacto elatlasdetarazed@gmail.com.
      </p>
      <h2>Objeto</h2>
      <p>
        El atlas de Tarazed ofrece contenidos divulgativos sobre astrología, el cálculo de cartas natales e interpretaciones personalizadas. Los contenidos tienen carácter orientativo y de entretenimiento y no sustituyen el consejo médico, psicológico, legal ni financiero de un profesional.
      </p>
      <h2>Compra de lecturas</h2>
      <p>
        Los recursos astrológicos (clima astral personalizado, revolución solar y sinastría) no van incluidos en Premium: cada lectura se compra por separado, por 5 euros con el IVA incluido, mediante un pago único con tarjeta a través de Stripe. Cada pago da derecho a una sola lectura y no es una suscripción.
      </p>
      <p>
        La lectura es un contenido digital que se genera y se entrega en el momento de la compra. Al comprar, aceptas expresamente que la entrega empiece de inmediato y reconoces que, una vez entregada la lectura, pierdes el derecho de desistimiento que la normativa de consumidores reconoce en los contratos a distancia (artículo 103 del texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios).
      </p>
      <p>
        Si has pagado y la lectura no llega a generarse, tu compra sigue disponible para que la generes de nuevo sin pagar otra vez. Si no pudiera entregarse, te devolveremos el importe. Para cualquier incidencia, escribe a elatlasdetarazed@gmail.com.
      </p>
      <h2>Propiedad intelectual</h2>
      <p>Los textos, diseños y logotipos de este sitio pertenecen a su titular o se usan con permiso. Las ilustraciones históricas proceden de obras de dominio público.</p>
      <h2>Responsabilidad</h2>
      <p>El titular no se hace responsable de las decisiones que los usuarios tomen basándose en los contenidos del sitio.</p>
      <h2>Fuentes de datos</h2>
      <p>
        Los cálculos astronómicos usan Astronomy Engine (licencia MIT, Don Cross) y datos de NASA JPL Horizons para Quirón. Las posiciones de las estrellas fijas proceden del catálogo Hipparcos. Los lugares de nacimiento proceden de GeoNames (geonames.org), con licencia Creative Commons Reconocimiento 4.0, y sus zonas horarias de tz-lookup y de la base de datos IANA.
      </p>
      <h2>Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española.</p>
    </LegalPage>
  );
}

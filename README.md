# El atlas de Tarazed

Web de astrología en español: cartas natales calculadas con precisión astronómica, clima astral semanal, lecturas combinadas y un asistente astrológico con memoria.

## Tecnología

- **Next.js 15** (App Router), alojado en **Vercel**.
- **Supabase** (región París): usuarios con contraseña, base de datos y reglas de seguridad por fila.
- Estilo propio a partir del sistema de diseño de El atlas de Tarazed (tema Noche, Cormorant Garamond y EB Garamond).

## Estado: fases 1 y 2

| Página | Ruta | Estado |
| --- | --- | --- |
| Portada con lista de espera | `/` | Lista |
| Introducción a la astrología e historia | `/introduccion` | Lista |
| Clima astral semanal | `/clima-astral` | Lista |
| Registro de lecturas | `/lecturas` | Bases; lecturas en preparación |
| Tu carta natal: crear, ver y borrar cartas | `/carta`, `/carta/nueva`, `/carta/[id]` | Lista |
| Planes | `/planes` | Informativa; pagos en fase 4 |
| Crear cuenta, entrar, recuperar contraseña | `/registro`, `/entrar`, `/recuperar` | Lista |
| Mi cuenta (datos, borrado RGPD) | `/cuenta` | Lista |
| Panel de publicación (solo administradores) | `/admin` | Listo |
| Aviso legal, privacidad, cookies | `/aviso-legal`, `/privacidad`, `/cookies` | Borradores |

## Variables de entorno

Ver `.env.example`. En Vercel: **Project → Settings → Environment Variables**.

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: públicas, ya rellenadas en `.env.example`.
- `SUPABASE_SERVICE_ROLE_KEY`: **secreta**. Solo en Vercel. Supabase → Project Settings → API Keys.
- `NEXT_PUBLIC_SITE_URL`: la dirección de la web.
- `SITE_PASSWORD`: contraseña para mantener la web privada durante el desarrollo.
- `NEXT_PUBLIC_SITE_PUBLIC`: `true` solo al lanzar, para que Google la indexe.

## Base de datos

El esquema está en `supabase/schema.sql` y ya está aplicado en el proyecto de Supabase.

Para convertirte en administrador, regístrate en la web y ejecuta en Supabase → SQL Editor (con tu correo):

```sql
update public.profiles set is_admin = true
  where id = (select id from auth.users where email = 'TU-CORREO@ejemplo.com');
```

## Correos de Supabase

En Supabase → Authentication → URL Configuration:

- **Site URL**: la dirección de la web.
- **Redirect URLs**: añade `https://TU-DOMINIO/auth/confirm`.

## Desarrollo en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Motor de cálculo (`lib/engine`)

Toda la web pide las cartas a través de una sola función, `computeChart()`. Las cartas se guardan como datos de nacimiento y se recalculan siempre con la versión actual del motor.

- Planetas, Sol y Luna: Astronomy Engine 2.1.19 (MIT), copiado en `lib/engine/vendor/`.
- Casas (Placidus, Koch, iguales, signos enteros), ángulos, nodos, Lilith, aspectos y estrellas fijas: código propio.
- Quirón: NASA JPL Horizons, comprimido en polinomios de Chebyshev (`lib/engine/data/chiron.json`, 1900-2100, error < 0,2″).
- Husos horarios históricos: base IANA de Node (Intl).
- Lugares: GeoNames (CC BY 4.0) con zona horaria de tz-lookup (CC0), en `lib/places/places.tsv.gz`. Se regenera con `node scripts/build-places.mjs cities500.json`.

Validación (`npx tsx scripts/validate-engine.ts reference.json`) frente a 8 cartas de referencia (1920-2038, ambos hemisferios):

| Elemento | Error máximo |
| --- | --- |
| Sol, Luna, planetas | 14″ |
| Casas Placidus, Koch, iguales; Ascendente, Medio Cielo | < 1″ |
| Nodo medio / verdadero | 0,1″ / 23″ |
| Quirón (frente a NASA) | 20″ |
| Lilith media / verdadera | ~7′ / ~8′ (diferencia de modelo lunar) |

## Motor de tránsitos (`lib/clima`)

`computeClimate(chart, from)` coloca el cielo de una ventana de días sobre una carta natal: ingresos de los planetas en las casas (las de la propia carta, Placidus) y en los signos, aspectos exactos a la carta natal, estaciones y lunaciones con sus eclipses, todo al minuto y con un peso para ordenar lo que más importa. No interpreta nada. La ventana es de 30 días desde `from`, ampliada hasta 10 más si justo después cae un evento importante (lunación, estación, ingreso de un planeta lento o un aspecto fuerte a un punto clave) y los que le sigan a menos de 2 días. Sin hora de nacimiento no hay casas ni ángulos: solo aspectos.

Revisión: `npx tsx scripts/validate-transits.ts [AAAA-MM-DDTHH:MMZ] [--json] [--sin-hora]` imprime el resultado para la carta de ejemplo. Frente a Swiss Ephemeris (solo como referencia externa), en 5 ventanas de un mes más una carta sin hora, los eventos coincidieron todos, sin ninguno de más ni de menos. Las horas coinciden con una mediana de 1 minuto; en los planetas casi parados (estaciones y aspectos de planetas lentos) pueden diferir hasta unas 3 horas.

## Compras de lecturas (`lib/purchases.ts`)

Los recursos astrológicos (clima personal, revolución solar, sinastría) no van incluidos en Premium: cada lectura se compra aparte, 5 € con un pago único de Stripe (Checkout en modo `payment`, el importe va en el código, no hace falta crear precios en Stripe). Cualquier cuenta registrada puede comprar.

- Una compra da derecho a una sola lectura. Estados: `pending` → `paid` (Stripe confirma el cobro) → `used` (la lectura se ha guardado); `refunded` si se reembolsa. Tabla `purchases`, que solo escribe el servidor.
- `startPurchase` (`app/actions/purchases.ts`) valida los datos, exige la casilla de desistimiento (contenido digital que se entrega al momento) y lleva a Stripe. Los administradores reciben la lectura sin cobro, para poder probar.
- La compra se da por pagada cuando vuelve el usuario, cuando llega el aviso de Stripe (`checkout.session.completed`, `checkout.session.async_payment_succeeded`) o al abrir la página del recurso. Debe haber esos eventos activados en el endpoint del webhook, además de `charge.refunded` para los reembolsos.
- La generación toma un candado de 10 minutos (`claimPurchase`), así que no se genera dos veces desde dos pestañas. Si la IA falla, la compra no se gasta y se puede reintentar sin pagar otra vez.

## Clima astral personalizado (`/carta/[id]/clima`)

Lectura extensa (unas 5.000 palabras) del cielo de los próximos 30 días sobre una carta natal, que se compra por separado (5 €, ver «Compras de lecturas»). El periodo empieza al generarla y se amplía hasta 10 días si justo después cae un evento importante (`lib/clima/transitos.ts`). Una carta no puede comprar otro clima mientras el anterior siga vigente.

- `lib/clima/facts.ts` convierte el resultado del motor en el texto de datos que recibe la IA; `climateSystemPrompt` y `CLIMATE_INSTRUCTIONS` (en `lib/ai/prompts.ts`) trasladan el método de interpretación de la marca: un hilo, jerarquía, relaciones, situaciones concretas. `npx tsx scripts/validate-transits.ts --facts` imprime esos datos.
- `/api/clima` toma el candado de una compra pagada, genera la lectura con streaming y, solo si se completa, la guarda en `monthly_climates` y da la compra por usada. Si la IA falla, la compra no se gasta.
- Casas: las de la propia carta (Placidus). Sin hora de nacimiento, solo aspectos.

## Revolución solar y sinastría (de pago por lectura)

Ya no van incluidas en Premium ni tienen cupo mensual: cada una se compra por separado (5 €, ver «Compras de lecturas») y trae su lectura extensa de unas 5.000 palabras, que antes no tenían (solo mostraban el cálculo). Siempre con casas Placidus.

- Se compra desde `/carta/[id]/revolucion` (año y lugar del cumpleaños) y `/sinastria` (las dos cartas y el tipo de vínculo). Al volver del pago, `/api/revolucion-solar` y `/api/sinastria` crean el cálculo y escriben la lectura con streaming; si la IA falla, el cálculo queda guardado, la compra no se gasta y se reintenta sin pagar otra vez.
- Las tablas `solar_returns` y `synastries` guardan la lectura (`reading`) y la compra (`purchase_id`, única). La política que exigía Premium para insertar se elimina: solo el servidor las crea.
- Las funciones y tablas de cupo (`solar_return_status`, `synastry_status`, `consume_*`, `*_usage`) ya no se usan.

## Licencias

El motor de cálculo no usa Swiss Ephemeris (AGPL). Swiss Ephemeris solo se ha usado fuera del proyecto, en un entorno de pruebas, para generar valores de referencia.

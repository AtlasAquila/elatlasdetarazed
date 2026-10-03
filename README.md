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

## Licencias

El motor de cálculo no usa Swiss Ephemeris (AGPL). Swiss Ephemeris solo se ha usado fuera del proyecto, en un entorno de pruebas, para generar valores de referencia.

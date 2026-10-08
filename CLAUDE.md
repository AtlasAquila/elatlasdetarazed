# Web de El atlas de Tarazed

elatlasdetarazed.com · repo AtlasAquila/elatlasdetarazed · Vercel (proyecto `elatlasdetarazed`) · Supabase (proyecto `atlas-aquila`, París).
El README tiene el estado por páginas, las variables de entorno y la validación del motor: léelo solo si la tarea lo necesita.

## Stack

Next.js 15 (App Router, server actions) + React 19 + TypeScript, sin librería de UI ni Tailwind: estilos en `app/globals.css` con variables (`--surface`, `--ink`, `--oro`, `--lapis`...; tema Noche, Cormorant Garamond y EB Garamond). Supabase con RLS en todas las tablas (`supabase/schema.sql`).

## Mapa

- `app/<ruta>/page.tsx`: páginas (clima-astral, blog, carta, sinastria, numerologia, admin, cuenta, legales...).
- `app/actions/*.ts`: server actions (posts, charts, auth, billing...). `app/api/*`: rutas de IA (lectura, asistente), lugares, Stripe.
- `components/`: un componente por archivo (ChartWheel, CicloLunar, LiveSkyWheel, PostEditor, RichText, SiteMenu...).
- `lib/engine/`: motor astronómico propio (`computeChart()`), validado contra Swiss Ephemeris. No lo toques sin volver a validar (`scripts/validate-engine.ts`).
- `lib/posts.ts`, `lib/post-shared.ts`: publicaciones `clima` y `blog`. El autor las publica desde `/admin`; no van en el código.
- `lib/ai/`: llamadas a Claude y prompts.

## Texto de las publicaciones (components/RichText.tsx)

Párrafos separados por una línea en blanco, `## ` y `### ` para subtítulos, listas con `- `, `**negrita**`, `*cursiva*` y enlaces solo internos (`[texto](/ruta)`). No admite tablas, imágenes, enlaces externos, citas ni listas numeradas. Si cambias este formato, avisa: el autor prepara los textos con estas reglas.

## Forma de trabajar

- Cambios pequeños y concretos. Si el cambio es grande (página nueva, esquema de base de datos, pagos), primero un plan breve.
- Cada cambio va en una rama y un PR contra `main`. Vercel crea una vista previa en cada PR y publica en producción al fusionar. No hagas push directo a `main` sin que lo pida el autor.
- Antes de abrir el PR, `npm run build` si el entorno tiene Node.js; si no, dilo en el PR.
- Commits en español con el formato del historial: `Área: qué cambia` (p. ej. `Clima astral: el ciclo lunar como desplegable`).
- Cambios en la base de datos: SQL nuevo al final de `supabase/schema.sql` (idempotente, con `if not exists`) y aplicarlo en Supabase solo con permiso.
- Nunca pegues ni pidas claves secretas (`SUPABASE_SERVICE_ROLE_KEY`, Stripe). Viven solo en Vercel.

## Textos de la web

Español de España. Tono sereno y literario, cercano sin ser coloquial. La astrología habla de tendencias, no de destinos: nada de fatalismo, y distinguir siempre el dato astronómico de la interpretación. Sin consejo médico, psicológico, legal ni financiero. El nombre se escribe «El atlas de Tarazed».

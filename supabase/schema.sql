-- Biblioteca Aquila (antes Atlas Aquila) · esquema de la base de datos (fase 1)
-- Ya aplicado en el proyecto de Supabase "atlas-aquila" (región París).
-- Se conserva aquí como referencia y para recrear la base de datos si hiciera falta.

-- Perfiles de usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  is_admin boolean not null default false,
  plan text not null default 'gratuito',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Cada usuario ve su perfil" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "Cada usuario edita su perfil" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- Nadie puede darse permisos de administrador ni cambiarse el plan desde la web.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- Al registrarse, se crea su perfil automáticamente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comprobación de administrador, en un esquema que no se expone a internet.
create schema if not exists private;
grant usage on schema private to anon, authenticated;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = (select auth.uid())), false);
$$;
revoke execute on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- Clima astral semanal
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  week_start date,
  published boolean not null default false,
  published_at timestamptz,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_published_idx on public.posts (published, published_at desc);
alter table public.posts enable row level security;
create policy "Todos leen lo publicado" on public.posts
  for select using (published or (select private.is_admin()));
create policy "Solo administradores crean" on public.posts
  for insert with check ((select private.is_admin()));
create policy "Solo administradores editan" on public.posts
  for update using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Solo administradores borran" on public.posts
  for delete using ((select private.is_admin()));

-- Lista de espera
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254 and email like '%_@_%'),
  created_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
create policy "Cualquiera se apunta" on public.waitlist
  for insert to anon, authenticated with check (char_length(email) <= 254);
create policy "Solo administradores ven la lista" on public.waitlist
  for select using ((select private.is_admin()));

-- Para convertirte en administrador tras registrarte en la web (cambia el correo):
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'TU-CORREO@ejemplo.com');

-- Textos editables desde el panel (/admin/textos)
create table if not exists public.site_texts (
  key text primary key check (char_length(key) <= 100),
  value text not null check (char_length(value) <= 5000),
  updated_at timestamptz not null default now()
);
alter table public.site_texts enable row level security;
create policy "Todos leen los textos" on public.site_texts
  for select using (true);
create policy "Solo administradores crean textos" on public.site_texts
  for insert with check ((select private.is_admin()));
create policy "Solo administradores editan textos" on public.site_texts
  for update using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Solo administradores borran textos" on public.site_texts
  for delete using ((select private.is_admin()));

-- ════════════════════════════════════════════════════════════
-- Cartas natales (migración cartas_natales)
-- ════════════════════════════════════════════════════════════
create table if not exists public.charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  birth_date date not null check (birth_date between '1800-01-01' and '2200-12-31'),
  birth_time time,
  time_unknown boolean not null default false,
  place_name text not null check (char_length(place_name) <= 200),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  time_zone text not null check (char_length(time_zone) <= 64),
  house_system text not null default 'placidus' check (house_system in ('placidus','koch','equal','whole')),
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists charts_user_id_idx on public.charts (user_id, created_at);
alter table public.charts enable row level security;

create policy "Cada usuario ve sus cartas" on public.charts
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario edita sus cartas" on public.charts
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cada usuario borra sus cartas" on public.charts
  for delete using ((select auth.uid()) = user_id);

-- Límite de cartas guardadas según el plan (3 gratuito, 10 premium), comprobado en la base de datos.
create or replace function private.chart_limit_ok(uid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select count(*) from public.charts c where c.user_id = uid)
       < (case when (select p.plan from public.profiles p where p.id = uid) = 'premium' then 10 else 3 end);
$$;
revoke execute on function private.chart_limit_ok(uuid) from public;
grant execute on function private.chart_limit_ok(uuid) to authenticated;

create policy "Cada usuario crea sus cartas dentro de su límite" on public.charts
  for insert with check ((select auth.uid()) = user_id and private.chart_limit_ok((select auth.uid())));

-- ════════════════════════════════════════════════════════════
-- Lecturas y asistente (migración lecturas_y_asistente)
-- ════════════════════════════════════════════════════════════
-- Lecturas combinadas generadas por la IA (una por carta y tipo).
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null references public.charts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('resumen', 'completa', 'extensa')), -- desde el 26 sep 2026 solo se genera 'extensa'
  content text not null,
  house_system text not null,
  engine_version int not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique (chart_id, kind)
);
create index if not exists readings_user_id_idx on public.readings (user_id);
alter table public.readings enable row level security;
create policy "Cada usuario ve sus lecturas" on public.readings
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario guarda sus lecturas" on public.readings
  for insert with check ((select auth.uid()) = user_id and exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid())));
create policy "Cada usuario borra sus lecturas" on public.readings
  for delete using ((select auth.uid()) = user_id);

-- Conversaciones con el asistente (una por carta).
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null unique references public.charts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  summary text not null default '',
  summarized_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx on public.conversations (user_id);
alter table public.conversations enable row level security;
create policy "Cada usuario ve sus conversaciones" on public.conversations
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario crea sus conversaciones" on public.conversations
  for insert with check ((select auth.uid()) = user_id and exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid())));
create policy "Cada usuario actualiza sus conversaciones" on public.conversations
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Mensajes. No se pueden editar ni borrar desde la web (así el contador de preguntas es fiable);
-- se borran solo al borrar la carta o la cuenta.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 12000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_user_idx on public.messages (user_id, role, created_at);
alter table public.messages enable row level security;
create policy "Cada usuario ve sus mensajes" on public.messages
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario guarda sus mensajes" on public.messages
  for insert with check ((select auth.uid()) = user_id and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));

-- ════════════════════════════════════════════════════════════
-- Contador de preguntas (migración contador_de_preguntas)
-- ════════════════════════════════════════════════════════════
create table if not exists public.question_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null, -- 'total' (plan gratuito) o 'AAAA-MM' (Premium)
  used int not null default 0,
  primary key (user_id, period)
);
alter table public.question_usage enable row level security;
create policy "Cada usuario ve su consumo" on public.question_usage
  for select using ((select auth.uid()) = user_id);
-- Sin políticas de escritura: solo las funciones de abajo modifican el contador.

create or replace function public.question_status()
returns table (plan text, is_admin boolean, used int, question_limit int, remaining int)
language sql stable security definer set search_path = ''
as $$
  with p as (
    select coalesce(pr.plan, 'gratuito') as plan, coalesce(pr.is_admin, false) as is_admin
    from public.profiles pr where pr.id = (select auth.uid())
  ), period as (
    select case when p.plan = 'premium' then to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM') else 'total' end as k,
           case when p.plan = 'premium' then 300 else 3 end as lim
    from p
  )
  select p.plan, p.is_admin,
         coalesce((select u.used from public.question_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0) as used,
         period.lim as question_limit,
         case when p.is_admin then 9999
              else greatest(period.lim - coalesce((select u.used from public.question_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0), 0) end as remaining
  from p, period;
$$;

create or replace function public.consume_question()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  k text;
begin
  if uid is null then return; end if;
  select case when pr.plan = 'premium' then to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM') else 'total' end
    into k from public.profiles pr where pr.id = uid;
  insert into public.question_usage (user_id, period, used) values (uid, coalesce(k, 'total'), 1)
  on conflict (user_id, period) do update set used = public.question_usage.used + 1;
end;
$$;

revoke execute on function public.question_status() from public, anon;
revoke execute on function public.consume_question() from public, anon;
grant execute on function public.question_status() to authenticated;
grant execute on function public.consume_question() to authenticated;

-- ════════════════════════════════════════════════════════════
-- Suscripciones con Stripe (migración suscripciones_stripe)
-- ════════════════════════════════════════════════════════════
-- Solo los escribe el servidor con la clave de servicio; el usuario solo puede editar display_name.
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_interval text check (subscription_interval in ('month', 'year')),
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

-- Eventos de Stripe ya procesados (idempotencia). Sin acceso desde la web.
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- ════════════════════════════════════════════════════════════
-- Numerología (migración numerologia)
-- ════════════════════════════════════════════════════════════
-- Personas guardadas para la numerología: hasta 10 por cuenta en todos los planes.
create table if not exists public.numerology_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  current_name text check (current_name is null or char_length(current_name) between 2 and 120),
  birth_date date not null check (birth_date between '1800-01-01' and '2200-12-31'),
  label text check (label is null or char_length(label) <= 40),
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists numerology_people_user_idx on public.numerology_people (user_id, created_at);
alter table public.numerology_people enable row level security;

create or replace function private.numerology_limit_ok(uid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select count(*) from public.numerology_people n where n.user_id = uid) < 10;
$$;
revoke execute on function private.numerology_limit_ok(uuid) from public;
grant execute on function private.numerology_limit_ok(uuid) to authenticated;

create policy "Cada usuario ve sus personas" on public.numerology_people
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario crea sus personas dentro del límite" on public.numerology_people
  for insert with check ((select auth.uid()) = user_id and private.numerology_limit_ok((select auth.uid())));
create policy "Cada usuario edita sus personas" on public.numerology_people
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cada usuario borra sus personas" on public.numerology_people
  for delete using ((select auth.uid()) = user_id);

-- Lecturas numerológicas con IA (solo Premium): de una persona, de una pareja o cruzada con una carta.
create table if not exists public.numerology_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('lectura', 'compatibilidad', 'carta')),
  person_id uuid not null references public.numerology_people (id) on delete cascade,
  other_person_id uuid references public.numerology_people (id) on delete cascade,
  chart_id uuid references public.charts (id) on delete cascade,
  content text not null,
  model text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists numerology_readings_unique_idx on public.numerology_readings
  (kind, person_id, coalesce(other_person_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(chart_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists numerology_readings_user_idx on public.numerology_readings (user_id);
create index if not exists numerology_readings_other_idx on public.numerology_readings (other_person_id);
create index if not exists numerology_readings_chart_idx on public.numerology_readings (chart_id);
alter table public.numerology_readings enable row level security;
create policy "Cada usuario ve sus lecturas numerológicas" on public.numerology_readings
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario guarda sus lecturas numerológicas" on public.numerology_readings
  for insert with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.numerology_people p where p.id = person_id and p.user_id = (select auth.uid()))
    and (other_person_id is null or exists (select 1 from public.numerology_people p where p.id = other_person_id and p.user_id = (select auth.uid())))
    and (chart_id is null or exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid())))
  );
create policy "Cada usuario borra sus lecturas numerológicas" on public.numerology_readings
  for delete using ((select auth.uid()) = user_id);

-- ════════════════════════════════════════════════════════════
-- Diario de sueños (migración diario_de_suenos)
-- ════════════════════════════════════════════════════════════
create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dream_date date not null,
  title text check (title is null or char_length(title) <= 120),
  content text not null check (char_length(content) between 10 and 8000),
  emotions text[] not null default '{}' check (cardinality(emotions) <= 8),
  recurring boolean not null default false,
  chart_id uuid references public.charts (id) on delete set null,
  interpretation text,
  summary text check (summary is null or char_length(summary) <= 600),
  symbols text[] not null default '{}' check (cardinality(symbols) <= 12),
  interpreted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dreams_user_idx on public.dreams (user_id, dream_date desc, created_at desc);
create index if not exists dreams_chart_idx on public.dreams (chart_id);
alter table public.dreams enable row level security;
create policy "Cada usuario ve sus sueños" on public.dreams
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario anota sus sueños" on public.dreams
  for insert with check ((select auth.uid()) = user_id and (chart_id is null or exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid()))));
create policy "Cada usuario actualiza sus sueños" on public.dreams
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (chart_id is null or exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid()))));
create policy "Cada usuario borra sus sueños" on public.dreams
  for delete using ((select auth.uid()) = user_id);

-- Análisis de patrones del diario (uno por usuario; se rehace cuando hay sueños nuevos).
create table if not exists public.dream_patterns (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null,
  dream_count int not null,
  last_dream_at timestamptz not null,
  model text not null,
  created_at timestamptz not null default now()
);
alter table public.dream_patterns enable row level security;
create policy "Cada usuario ve sus patrones" on public.dream_patterns
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario guarda sus patrones" on public.dream_patterns
  for insert with check ((select auth.uid()) = user_id);
create policy "Cada usuario actualiza sus patrones" on public.dream_patterns
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Cada usuario borra sus patrones" on public.dream_patterns
  for delete using ((select auth.uid()) = user_id);

-- ════════════════════════════════════════════════════════════
-- Panel de usuarios y consultas (migración panel_usuarios)
-- ════════════════════════════════════════════════════════════
-- Funciones de solo lectura para /admin/usuarios y /admin/consultas. Fallan si quien llama no es administrador.
create or replace function public.admin_users()
returns table (
  id uuid, email text, display_name text, plan text, is_admin boolean,
  created_at timestamptz, last_sign_in_at timestamptz, email_confirmed boolean,
  charts int, questions int, readings int, numerology_people int, dreams int,
  last_activity timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  return query
  select u.id, u.email::text, p.display_name, coalesce(p.plan, 'gratuito'), coalesce(p.is_admin, false),
         u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
         (select count(*)::int from public.charts c where c.user_id = u.id),
         (select count(*)::int from public.messages m where m.user_id = u.id and m.role = 'user'),
         (select count(*)::int from public.readings r where r.user_id = u.id),
         (select count(*)::int from public.numerology_people n where n.user_id = u.id),
         (select count(*)::int from public.dreams d where d.user_id = u.id),
         greatest(
           u.last_sign_in_at,
           (select max(m.created_at) from public.messages m where m.user_id = u.id),
           (select max(c.created_at) from public.charts c where c.user_id = u.id),
           (select max(d.created_at) from public.dreams d where d.user_id = u.id),
           (select max(n.created_at) from public.numerology_people n where n.user_id = u.id)
         )
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

create or replace function public.admin_user_messages(uid uuid)
returns table (id uuid, created_at timestamptz, role text, content text, chart_name text, chart_id uuid)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  return query
  select m.id, m.created_at, m.role, m.content, c.name, c.id
  from public.messages m
  join public.conversations cv on cv.id = m.conversation_id
  join public.charts c on c.id = cv.chart_id
  where m.user_id = uid
  order by m.created_at desc
  limit 400;
end;
$$;

create or replace function public.admin_recent_questions(lim int default 100)
returns table (id uuid, created_at timestamptz, content text, user_id uuid, email text, chart_name text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Solo administradores' using errcode = '42501';
  end if;
  return query
  select m.id, m.created_at, m.content, m.user_id, u.email::text, c.name
  from public.messages m
  join auth.users u on u.id = m.user_id
  join public.conversations cv on cv.id = m.conversation_id
  join public.charts c on c.id = cv.chart_id
  where m.role = 'user'
  order by m.created_at desc
  limit least(greatest(lim, 1), 500);
end;
$$;

revoke execute on function public.admin_users() from public, anon;
revoke execute on function public.admin_user_messages(uuid) from public, anon;
revoke execute on function public.admin_recent_questions(int) from public, anon;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_user_messages(uuid) to authenticated;
grant execute on function public.admin_recent_questions(int) to authenticated;

-- ════════════════════════════════════════════════════════════
-- Revolución solar (migración revolucion_solar)
-- ════════════════════════════════════════════════════════════
-- Solo Premium; 2 cálculos al mes. Cada cálculo es para un lugar nuevo (no hay "lugar guardado"),
-- así que se guardan como historial ligado a la carta natal de referencia.
create table if not exists public.solar_returns (
  id uuid primary key default gen_random_uuid(),
  chart_id uuid not null references public.charts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null check (year between 1900 and 2200),
  place_name text not null check (char_length(place_name) <= 200),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  time_zone text not null check (char_length(time_zone) <= 64),
  house_system text not null default 'placidus' check (house_system in ('placidus','koch','equal','whole')),
  engine_version int not null,
  return_utc timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists solar_returns_chart_idx on public.solar_returns (chart_id, created_at desc);
create index if not exists solar_returns_user_idx on public.solar_returns (user_id, created_at desc);
alter table public.solar_returns enable row level security;

create policy "Cada usuario ve sus revoluciones solares" on public.solar_returns
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario borra sus revoluciones solares" on public.solar_returns
  for delete using ((select auth.uid()) = user_id);
-- El cupo mensual (2 al mes) se comprueba en la aplicación con solar_return_status()/consume_solar_return();
-- aquí solo se exige ser Premium y ser dueño de la carta, como segunda barrera.
create policy "Solo Premium crea revoluciones solares de sus cartas" on public.solar_returns
  for insert with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.charts c where c.id = chart_id and c.user_id = (select auth.uid()))
    and (select coalesce(p.plan, 'gratuito') from public.profiles p where p.id = (select auth.uid())) = 'premium'
  );

-- Cupo mensual de revoluciones solares, con el mismo patrón que el contador de preguntas.
create table if not exists public.solar_return_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null, -- 'AAAA-MM' en hora de Madrid
  used int not null default 0,
  primary key (user_id, period)
);
alter table public.solar_return_usage enable row level security;
create policy "Cada usuario ve su consumo de revoluciones solares" on public.solar_return_usage
  for select using ((select auth.uid()) = user_id);
-- Sin políticas de escritura: solo las funciones de abajo modifican el contador.

create or replace function public.solar_return_status()
returns table (plan text, is_admin boolean, used int, sr_limit int, remaining int)
language sql stable security definer set search_path = ''
as $$
  with p as (
    select coalesce(pr.plan, 'gratuito') as plan, coalesce(pr.is_admin, false) as is_admin
    from public.profiles pr where pr.id = (select auth.uid())
  ), period as (
    select to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM') as k, 2 as lim
  )
  select p.plan, p.is_admin,
         coalesce((select u.used from public.solar_return_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0) as used,
         period.lim as sr_limit,
         case when p.is_admin then 9999
              when p.plan <> 'premium' then 0
              else greatest(period.lim - coalesce((select u.used from public.solar_return_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0), 0) end as remaining
  from p, period;
$$;

create or replace function public.consume_solar_return()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  k text := to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM');
begin
  if uid is null then return; end if;
  insert into public.solar_return_usage (user_id, period, used) values (uid, k, 1)
  on conflict (user_id, period) do update set used = public.solar_return_usage.used + 1;
end;
$$;

revoke execute on function public.solar_return_status() from public, anon;
revoke execute on function public.consume_solar_return() from public, anon;
grant execute on function public.solar_return_status() to authenticated;
grant execute on function public.consume_solar_return() to authenticated;

-- ════════════════════════════════════════════════════════════
-- Sinastría (migración sinastria)
-- ════════════════════════════════════════════════════════════
-- Se puede comparar cualquier par de cartas guardadas por la cuenta. Solo Premium; 3 cálculos
-- al mes. Las casas superpuestas van solo en un sentido: los planetas de B caen en las casas
-- de A (A es "carta base").
create table if not exists public.synastries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chart_a_id uuid not null references public.charts (id) on delete cascade,
  chart_b_id uuid not null references public.charts (id) on delete cascade,
  -- Tipo de vínculo entre las dos cartas: la lectura se adapta a ello (no es lo mismo pareja que familia o trabajo).
  relationship_type text not null default 'pareja' check (relationship_type in ('pareja', 'familia', 'amistad', 'trabajo', 'otro')),
  engine_version int not null,
  created_at timestamptz not null default now(),
  check (chart_a_id <> chart_b_id)
);
create index if not exists synastries_user_idx on public.synastries (user_id, created_at desc);
create index if not exists synastries_a_idx on public.synastries (chart_a_id);
create index if not exists synastries_b_idx on public.synastries (chart_b_id);
alter table public.synastries enable row level security;

create policy "Cada usuario ve sus sinastrías" on public.synastries
  for select using ((select auth.uid()) = user_id);
create policy "Cada usuario borra sus sinastrías" on public.synastries
  for delete using ((select auth.uid()) = user_id);
-- El cupo mensual (3 al mes) se comprueba en la aplicación con synastry_status()/consume_synastry();
-- aquí solo se exige ser Premium y que las dos cartas sean de la cuenta, como segunda barrera.
create policy "Solo Premium crea sinastrías de sus cartas" on public.synastries
  for insert with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.charts c where c.id = chart_a_id and c.user_id = (select auth.uid()))
    and exists (select 1 from public.charts c where c.id = chart_b_id and c.user_id = (select auth.uid()))
    and (select coalesce(p.plan, 'gratuito') from public.profiles p where p.id = (select auth.uid())) = 'premium'
  );

-- Cupo mensual de sinastrías, con el mismo patrón que el contador de preguntas y de revoluciones solares.
create table if not exists public.synastry_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null, -- 'AAAA-MM' en hora de Madrid
  used int not null default 0,
  primary key (user_id, period)
);
alter table public.synastry_usage enable row level security;
create policy "Cada usuario ve su consumo de sinastrías" on public.synastry_usage
  for select using ((select auth.uid()) = user_id);
-- Sin políticas de escritura: solo las funciones de abajo modifican el contador.

create or replace function public.synastry_status()
returns table (plan text, is_admin boolean, used int, synastry_limit int, remaining int)
language sql stable security definer set search_path = ''
as $$
  with p as (
    select coalesce(pr.plan, 'gratuito') as plan, coalesce(pr.is_admin, false) as is_admin
    from public.profiles pr where pr.id = (select auth.uid())
  ), period as (
    select to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM') as k, 3 as lim
  )
  select p.plan, p.is_admin,
         coalesce((select u.used from public.synastry_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0) as used,
         period.lim as synastry_limit,
         case when p.is_admin then 9999
              when p.plan <> 'premium' then 0
              else greatest(period.lim - coalesce((select u.used from public.synastry_usage u where u.user_id = (select auth.uid()) and u.period = period.k), 0), 0) end as remaining
  from p, period;
$$;

create or replace function public.consume_synastry()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  k text := to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM');
begin
  if uid is null then return; end if;
  insert into public.synastry_usage (user_id, period, used) values (uid, k, 1)
  on conflict (user_id, period) do update set used = public.synastry_usage.used + 1;
end;
$$;

revoke execute on function public.synastry_status() from public, anon;
revoke execute on function public.consume_synastry() from public, anon;
grant execute on function public.synastry_status() to authenticated;
grant execute on function public.consume_synastry() to authenticated;

-- ════════════════════════════════════════════════════════════
-- Compras de lecturas (migración compras_lecturas)
-- ════════════════════════════════════════════════════════════
-- Cada recurso astrológico (clima personal, revolución solar, sinastría) se compra por separado:
-- 5 € por lectura, con un pago único de Stripe. Una compra da derecho a una sola lectura.
-- pending → paid (Stripe confirma el cobro) → used (la lectura ya se ha guardado). Solo escribe el
-- servidor, con la clave de servicio; el usuario solo puede ver sus compras.
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('clima', 'revolucion', 'sinastria')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'used', 'refunded')),
  -- Qué se compra: la carta (o las dos cartas) y, en la revolución solar, el año y el lugar.
  params jsonb not null default '{}'::jsonb,
  -- Precio de lista y lo que se ha cobrado de verdad (un código promocional puede rebajarlo).
  amount_cents int not null check (amount_cents >= 0),
  paid_cents int check (paid_cents >= 0),
  currency text not null default 'eur',
  stripe_session_id text unique,
  stripe_payment_intent text,
  -- El comprador acepta que la lectura se entrega al momento y pierde el derecho de desistimiento.
  consent_at timestamptz not null,
  paid_at timestamptz,
  used_at timestamptz,
  refunded_at timestamptz,
  -- Candado mientras se escribe la lectura (evita generarla dos veces desde dos pestañas).
  generating_since timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);
create index if not exists purchases_payment_intent_idx on public.purchases (stripe_payment_intent);
alter table public.purchases enable row level security;
drop policy if exists "Cada usuario ve sus compras" on public.purchases;
create policy "Cada usuario ve sus compras" on public.purchases
  for select using ((select auth.uid()) = user_id);
-- Sin políticas de escritura: solo el servidor crea y cambia compras.

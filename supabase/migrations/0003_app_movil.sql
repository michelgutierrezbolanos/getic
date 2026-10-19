-- App móvil: perfiles automáticos, acciones generales para el bot, checador,
-- horario, vehículo, solicitudes y evidencias fotográficas.
-- Aplicar en Supabase > SQL Editor después de 0002.

-- Perfiles ------------------------------------------------------------------
alter table public.perfiles
  add column if not exists email text unique,
  add column if not exists puesto text not null default 'Ingeniero de Campo';

-- "michel.gutierrez@..." -> "Michel Gutierrez"
create or replace function public.nombre_desde_email(correo text) returns text
language sql immutable as $$
  select initcap(replace(split_part(correo, '@', 1), '.', ' '))
$$;

create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (new.id, public.nombre_desde_email(new.email), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil();

-- Usuarios que ya existían
insert into public.perfiles (id, nombre, email)
select id, public.nombre_desde_email(email), email from auth.users
on conflict (id) do update set email = excluded.email;

drop policy if exists "editar perfil propio" on public.perfiles;
create policy "editar perfil propio" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Acciones del bot: ahora no todas son de un folio --------------------------
alter table public.acciones_bot alter column folio drop not null;
alter table public.acciones_bot drop constraint if exists acciones_bot_accion_check;
alter table public.acciones_bot add constraint acciones_bot_accion_check
  check (accion in ('tomar', 'confirmar', 'llegada', 'cierre', 'checada', 'solicitud'));

-- Evidencias del cierre (rutas en Storage)
alter table public.reportes
  add column if not exists folio_falso text,          -- '#NSF' / '#FDR'
  add column if not exists evidencias text[] not null default '{}';

-- Horario asignado (lo carga el bot desde Getic) ----------------------------
create table if not exists public.horarios (
  perfil_id uuid not null references public.perfiles (id) on delete cascade,
  fecha date not null,
  entrada time,
  comida time,
  salida time,
  descanso boolean not null default false,
  primary key (perfil_id, fecha)
);

-- Checadas del día --------------------------------------------------------
create table if not exists public.checadas (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfiles (id) on delete cascade default auth.uid(),
  fecha date not null default (now() at time zone 'America/Mexico_City')::date,
  tipo text not null check (tipo in ('inicio', 'comida_inicio', 'comida_fin', 'salida')),
  hora timestamptz not null default now(),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho', 'error')),
  unique (perfil_id, fecha, tipo)
);

-- Vehículo asignado (lo carga el bot) -----------------------------------------
create table if not exists public.vehiculos (
  perfil_id uuid primary key references public.perfiles (id) on delete cascade,
  placa text,
  numero_economico text,
  updated_at timestamptz not null default now()
);

-- Solicitudes (gasolina, velocidad, TAG) ------------------------------------
create table if not exists public.solicitudes (
  id bigint generated always as identity primary key,
  perfil_id uuid not null references public.perfiles (id) on delete cascade default auth.uid(),
  tipo text not null check (tipo in ('gasolina', 'velocidad', 'tag')),
  datos jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'enviada', 'aprobada', 'rechazada', 'error')),
  created_at timestamptz not null default now()
);

-- RLS: cada ingeniero ve y crea solo lo suyo -----------------------------------
alter table public.horarios enable row level security;
alter table public.checadas enable row level security;
alter table public.vehiculos enable row level security;
alter table public.solicitudes enable row level security;

drop policy if exists "horario propio" on public.horarios;
create policy "horario propio" on public.horarios
  for select to authenticated using (perfil_id = auth.uid());

drop policy if exists "checadas propias" on public.checadas;
create policy "checadas propias" on public.checadas
  for select to authenticated using (perfil_id = auth.uid());
drop policy if exists "checar" on public.checadas;
create policy "checar" on public.checadas
  for insert to authenticated with check (perfil_id = auth.uid());

drop policy if exists "vehiculo propio" on public.vehiculos;
create policy "vehiculo propio" on public.vehiculos
  for select to authenticated using (perfil_id = auth.uid());

drop policy if exists "solicitudes propias" on public.solicitudes;
create policy "solicitudes propias" on public.solicitudes
  for select to authenticated using (perfil_id = auth.uid());
drop policy if exists "solicitar" on public.solicitudes;
create policy "solicitar" on public.solicitudes
  for insert to authenticated with check (perfil_id = auth.uid());

-- Storage: fotos de evidencia ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

drop policy if exists "subir evidencias" on storage.objects;
create policy "subir evidencias" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidencias');
drop policy if exists "ver evidencias" on storage.objects;
create policy "ver evidencias" on storage.objects
  for select to authenticated using (bucket_id = 'evidencias');

-- Realtime ------------------------------------------------------------------
alter publication supabase_realtime add table public.checadas, public.solicitudes, public.horarios, public.vehiculos;

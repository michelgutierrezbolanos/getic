-- Esquema inicial Getic (preparado para las siguientes etapas; el login solo usa auth.users).
-- Aplicar en Supabase > SQL Editor.

-- Perfiles de usuario --------------------------------------------------------
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol text not null default 'ingeniero' check (rol in ('ingeniero', 'admin')),
  created_at timestamptz not null default now()
);

-- Reportes (clon de los folios de app.getic.mx, los inserta el bot) ---------
create table if not exists public.reportes (
  folio text primary key,                 -- Numero de incidente (INC14911536)
  plaza text,                             -- OPV-Prov Vallarta
  cliente text,                           -- OXXO MX
  cr text,                                -- 50YYB
  tienda text,                            -- Guayabitos PVA
  tipo_registro text,                     -- Incidencia
  prioridad text,                         -- Alta / Media / Baja
  grupo_servicio text,                    -- CCTV
  concepto_servicio text,                 -- Camara
  categoria_opv text,                     -- OPV CCTV-HARDWARE
  categoria_incidencia text,
  reporte_folio text,                     -- descripción del reporte
  ingeniero_asignado text,
  responsable_id uuid references public.perfiles (id),
  ati text,
  estado text,                            -- Asignado / Confirmado / En sitio / Cerrado...
  fecha_creacion timestamptz,
  fecha_programacion timestamptz,
  fecha_transferencia timestamptz,
  fecha_asignacion timestamptz,
  fecha_confirmacion timestamptz,
  fecha_llegada timestamptz,
  fecha_resuelto timestamptz,
  fecha_limite timestamptz,               -- para calcular "Tiempo restante"
  -- Datos de cierre capturados en la app móvil
  solucion text,
  vobo text,
  atiende text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cola de acciones que el bot ejecuta en Getic / WhatsApp --------------------
create table if not exists public.acciones_bot (
  id bigint generated always as identity primary key,
  folio text not null references public.reportes (folio) on delete cascade,
  accion text not null check (accion in ('tomar', 'confirmar', 'llegada', 'cierre')),
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'hecho', 'error')),
  error text,
  solicitado_por uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  procesado_at timestamptz
);
create index if not exists acciones_bot_pendientes on public.acciones_bot (estado, created_at);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists reportes_updated_at on public.reportes;
create trigger reportes_updated_at before update on public.reportes
  for each row execute function public.touch_updated_at();

-- RLS: usuarios autenticados leen; el bot usa la secret key (salta RLS) -----
alter table public.perfiles enable row level security;
alter table public.reportes enable row level security;
alter table public.acciones_bot enable row level security;

create policy "perfil propio" on public.perfiles
  for select to authenticated using (id = auth.uid());

create policy "leer reportes" on public.reportes
  for select to authenticated using (true);

create policy "leer acciones" on public.acciones_bot
  for select to authenticated using (true);

create policy "solicitar acciones" on public.acciones_bot
  for insert to authenticated with check (solicitado_por = auth.uid());

-- Realtime para que web y móvil se actualicen al instante
alter publication supabase_realtime add table public.reportes, public.acciones_bot;

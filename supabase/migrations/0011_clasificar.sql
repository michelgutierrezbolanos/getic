-- Clasificar incidencia desde la app: grupo y concepto de servicio.
-- El bot copia de Getic el catálogo de grupos/conceptos y ejecuta la clasificación.
-- Aplicar después de 0010.

-- Catálogo de grupos y conceptos de servicio (lo llena el bot desde Getic).
create table if not exists public.catalogo_servicios (
  id int primary key default 1,
  datos jsonb not null default '{}'::jsonb,   -- { grupos: [{ grupo, conceptos: [{nombre, prioridad}] }] }
  updated_at timestamptz not null default now()
);

alter table public.catalogo_servicios enable row level security;
drop policy if exists "leer catalogo" on public.catalogo_servicios;
create policy "leer catalogo" on public.catalogo_servicios
  for select to authenticated using (true);

-- Nueva acción del bot: clasificar
alter table public.acciones_bot drop constraint if exists acciones_bot_accion_check;
alter table public.acciones_bot add constraint acciones_bot_accion_check
  check (accion in ('tomar', 'confirmar', 'llegada', 'cierre', 'comentario', 'clasificar', 'checada', 'solicitud'));

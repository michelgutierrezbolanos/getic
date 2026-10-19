-- Datos extra para clonar la lista y el detalle de folios de Getic.
-- Aplicar en Supabase > SQL Editor después de 0004.

alter table public.reportes
  add column if not exists inc_id text,                                  -- id interno de Getic (inc_id=...)
  add column if not exists latitud double precision,                     -- ubicación de la tienda (Google Maps)
  add column if not exists longitud double precision,
  add column if not exists sla_minutos integer,                          -- minutos de SLA (Hora Alta + SLA = límite)
  add column if not exists comentarios jsonb not null default '[]'::jsonb,       -- [{usuario, mensaje, fecha, tipo}]
  add column if not exists historial_tienda jsonb not null default '[]'::jsonb;  -- últimas incidencias en la tienda

-- Nueva acción: comentario en el folio
alter table public.acciones_bot drop constraint if exists acciones_bot_accion_check;
alter table public.acciones_bot add constraint acciones_bot_accion_check
  check (accion in ('tomar', 'confirmar', 'llegada', 'cierre', 'comentario', 'checada', 'solicitud'));

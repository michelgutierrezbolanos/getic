-- Folios en pausa: Getic regresó el folio de estado (p. ej. de LlegadaSitio a
-- Sin Asignar porque falta una pieza). Aplicar después de 0007.

alter table public.reportes
  add column if not exists pausado_at timestamptz,   -- cuándo lo detectó el bot
  add column if not exists estado_previo text;       -- en qué estado estaba antes de la pausa

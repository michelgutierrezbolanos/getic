-- Cierre enviado desde la app: el ingeniero ya pegó el machote en WhatsApp.
-- El bot cierra el folio en Getic (vía el bot del grupo) y lo pasa a Cerrados.
-- Aplicar después de 0009.

alter table public.reportes
  add column if not exists cierre_enviado_at timestamptz;

-- Historial detallado de solicitudes de gasolina: el bot guarda en cada solicitud
-- el resultado de Getic (autorizada / finalizada / rechazada) además de lo que se envió.
-- Aplicar después de 0013.

alter table public.solicitudes drop constraint if exists solicitudes_estado_check;
alter table public.solicitudes add constraint solicitudes_estado_check
  check (estado in (
    'pendiente', 'enviada', 'aprobada', 'autorizada', 'finalizada', 'rechazada', 'error'
  ));

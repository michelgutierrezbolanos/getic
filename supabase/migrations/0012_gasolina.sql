-- Solicitud de gasolina desde la app/web y evidencia de la carga aprobada.
-- El estado de la última carga (verde/amarillo/rojo) lo refleja el bot en
-- inicio_getic.datos.gas (no requiere columnas nuevas).
-- Aplicar después de 0011.

-- Nueva acción del bot: subir la evidencia (foto del ticket) de una carga autorizada.
alter table public.acciones_bot drop constraint if exists acciones_bot_accion_check;
alter table public.acciones_bot add constraint acciones_bot_accion_check
  check (accion in (
    'tomar', 'confirmar', 'llegada', 'cierre', 'comentario',
    'clasificar', 'checada', 'solicitud', 'evidencia_gas'
  ));

-- Nueva acción del bot: leer de Getic las tarjetas de gasolina del ingeniero.
-- La pide la app al abrir "Solicitar gasolina" cuando no tiene tarjetas cargadas
-- y no hay una solicitud en curso. Aplicar después de 0017.
alter table public.acciones_bot drop constraint if exists acciones_bot_accion_check;
alter table public.acciones_bot add constraint acciones_bot_accion_check
  check (accion in (
    'tomar', 'confirmar', 'llegada', 'cierre', 'comentario',
    'clasificar', 'checada', 'solicitud', 'evidencia_gas', 'leer_tarjetas'
  ));

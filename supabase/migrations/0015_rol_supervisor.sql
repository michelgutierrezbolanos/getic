-- Panel de supervisión (web): rol 'supervisor' (solo lectura del panel).
-- Aplicar después de 0014.

alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('ingeniero', 'admin', 'supervisor'));

-- Marca a Jesús como supervisor (debe existir ya como usuario).
update public.perfiles set rol = 'supervisor'
where id = (select id from auth.users where lower(email) = 'jesus.belmonte@getic.mx');

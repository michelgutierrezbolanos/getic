-- Login con las credenciales reales de Getic (una por ingeniero).
-- El bot valida contra Getic y guarda aquí SOLO quién es y si su sesión está activa.
-- La contraseña NUNCA se guarda. Aplicar después de 0008.

alter table public.perfiles
  add column if not exists getic_email text,                       -- correo con el que entra a Getic
  add column if not exists getic_usu_id text,                      -- su usu_id en Getic
  add column if not exists getic_sesion_activa boolean not null default false,
  add column if not exists getic_sesion_at timestamptz,            -- última vez que inició sesión en Getic
  -- Vale de un solo uso: el bot lo pone al validar en Getic; el portal lo canjea por la sesión.
  add column if not exists login_nonce text,
  add column if not exists login_nonce_at timestamptz;

-- El usuario puede leer su propio estado de sesión (la política de perfiles ya lo permite).
-- El bot escribe estas columnas con la secret key (salta RLS).

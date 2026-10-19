-- Tiempo restante tal como lo muestra Getic (lo captura el bot) y permisos de escritura.
-- Aplicar en Supabase > SQL Editor después de 0001_init.sql.

alter table public.reportes
  add column if not exists tiempo_restante text,                -- "15:59:36" o "1dia(s) 21:20:24"
  add column if not exists tiempo_vencido boolean not null default false,  -- true = Getic lo muestra en rojo
  add column if not exists tiempo_capturado_at timestamptz;     -- momento en que el bot leyó el valor

-- Usuarios con sesión pueden dar de alta y editar reportes (alta manual desde la web).
-- El bot usa el endpoint /api/bot/reportes con la secret key, que no pasa por RLS.
drop policy if exists "alta reportes" on public.reportes;
create policy "alta reportes" on public.reportes
  for insert to authenticated with check (true);

drop policy if exists "editar reportes" on public.reportes;
create policy "editar reportes" on public.reportes
  for update to authenticated using (true) with check (true);

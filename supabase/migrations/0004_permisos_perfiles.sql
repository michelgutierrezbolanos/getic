-- Permisos de perfiles: cada usuario solo puede cambiar su nombre (no su rol).
-- Aplicar en Supabase > SQL Editor después de 0003. Se puede ejecutar más de una vez.

-- Limpieza por si se ejecutó la versión anterior de este archivo
drop policy if exists "perfil propio" on public.perfiles;
drop policy if exists "editar perfil propio" on public.perfiles;
drop function if exists public.es_admin();
alter table public.perfiles drop column if exists enviar_portal_alternativo;

revoke update on public.perfiles from authenticated;
grant update (nombre) on public.perfiles to authenticated;

create policy "perfil propio" on public.perfiles
  for select to authenticated using (id = auth.uid());

create policy "editar perfil propio" on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

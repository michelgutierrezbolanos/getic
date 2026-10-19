-- Configuración por usuario: "Enviar datos a portal alternativo" (sí/no) y
-- administración de usuarios. Aplicar en Supabase > SQL Editor después de 0003.

alter table public.perfiles
  add column if not exists enviar_portal_alternativo boolean not null default true;

-- ¿El usuario actual es admin? (security definer para no chocar con RLS)
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'admin')
$$;

-- Los usuarios solo pueden cambiar su nombre y la opción; el rol no.
revoke update on public.perfiles from authenticated;
grant update (nombre, enviar_portal_alternativo) on public.perfiles to authenticated;

drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio" on public.perfiles
  for select to authenticated using (id = auth.uid() or public.es_admin());

drop policy if exists "editar perfil propio" on public.perfiles;
create policy "editar perfil propio" on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.es_admin())
  with check (id = auth.uid() or public.es_admin());

-- Primer administrador
update public.perfiles set rol = 'admin' where email = 'michel.gutierrez@getic.com.mx';

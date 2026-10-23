-- Ubicación de cada ingeniero (para "reportes más cercanos" en el panel).
-- La app la actualiza cada pocos minutos mientras está abierta.
-- Aplicar después de 0016.

create table if not exists public.ubicaciones (
  perfil_id uuid primary key references public.perfiles (id) on delete cascade,
  latitud double precision not null,
  longitud double precision not null,
  actualizada_at timestamptz not null default now()
);

alter table public.ubicaciones enable row level security;

drop policy if exists "leer ubicaciones" on public.ubicaciones;
create policy "leer ubicaciones" on public.ubicaciones
  for select to authenticated using (true);

drop policy if exists "guardar mi ubicacion" on public.ubicaciones;
create policy "guardar mi ubicacion" on public.ubicaciones
  for insert to authenticated with check (perfil_id = auth.uid());

drop policy if exists "actualizar mi ubicacion" on public.ubicaciones;
create policy "actualizar mi ubicacion" on public.ubicaciones
  for update to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

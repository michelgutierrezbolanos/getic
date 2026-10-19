-- Resumen del inicio de Getic (días sin siniestros, SLA, folios "Al Momento",
-- anuncios) que el bot copia para el clon del inicio. Aplicar después de 0005.

create table if not exists public.inicio_getic (
  perfil_id uuid primary key references public.perfiles (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.inicio_getic enable row level security;

drop policy if exists "inicio propio" on public.inicio_getic;
create policy "inicio propio" on public.inicio_getic
  for select to authenticated using (perfil_id = auth.uid());

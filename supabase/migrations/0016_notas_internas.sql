-- Notas internas por folio: comentarios del equipo que NO van a Getic.
-- Los ingenieros las crean desde la app; el supervisor las ve en el panel.
-- Aplicar después de 0015.

create table if not exists public.notas_internas (
  id bigint generated always as identity primary key,
  folio text not null,
  perfil_id uuid not null references public.perfiles (id) on delete cascade default auth.uid(),
  nombre text,            -- nombre del autor (para mostrar sin join)
  texto text not null,
  created_at timestamptz not null default now()
);

create index if not exists notas_internas_folio on public.notas_internas (folio, created_at);

alter table public.notas_internas enable row level security;

drop policy if exists "leer notas internas" on public.notas_internas;
create policy "leer notas internas" on public.notas_internas
  for select to authenticated using (true);

drop policy if exists "crear notas internas" on public.notas_internas;
create policy "crear notas internas" on public.notas_internas
  for insert to authenticated with check (perfil_id = auth.uid());

-- Tiempo real para que la app las muestre al instante.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notas_internas'
  ) then
    alter publication supabase_realtime add table public.notas_internas;
  end if;
end $$;

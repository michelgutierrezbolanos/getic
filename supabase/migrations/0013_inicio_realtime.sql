-- La app móvil lee inicio_getic con .stream() (Realtime): checador y estado de
-- gasolina/tarjetas. Sin esta tabla en la publicación, el stream no recibe nada.
-- Aplicar después de 0012.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inicio_getic'
  ) then
    alter publication supabase_realtime add table public.inicio_getic;
  end if;
end $$;

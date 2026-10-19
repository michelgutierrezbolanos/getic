-- Horario: saber cuándo cambió cada día (el bot lo reenvía cada 10 min).
-- updated_at solo se mueve si cambian entrada, comida, salida o descanso.
-- Aplicar en Supabase > SQL Editor después de 0006.

alter table public.horarios
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists cambio_at timestamptz;          -- última vez que Getic cambió ese día

create or replace function public.horario_cambio() returns trigger
language plpgsql as $$
begin
  if (new.entrada, new.comida, new.salida, new.descanso)
     is distinct from (old.entrada, old.comida, old.salida, old.descanso) then
    new.cambio_at = now();
    new.updated_at = now();
  else
    new.cambio_at = old.cambio_at;
    new.updated_at = old.updated_at;
  end if;
  return new;
end $$;

drop trigger if exists horarios_cambio on public.horarios;
create trigger horarios_cambio before update on public.horarios
  for each row execute function public.horario_cambio();

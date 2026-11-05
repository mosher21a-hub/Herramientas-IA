-- ============================================================
-- ToolNest · Parche: visibilidad del catálogo sembrado
-- Las 63 herramientas del seed quedaron privadas porque el trigger
-- no contemplaba filas con user_id null (sin dueño). Este parche:
--   1) corrige la función (user_id null → público)
--   2) vuelve públicas las filas del catálogo sin dueño
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

create or replace function public.force_visibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_role text;
begin
  -- Filas del catálogo sembrado (user_id null) se consideran públicas.
  if new.user_id is null then
    new.is_public := true;
    return new;
  end if;
  select role into creator_role from public.profiles where id = new.user_id;
  if creator_role = 'admin' then
    new.is_public := true;
  else
    new.is_public := false;
  end if;
  return new;
end;
$$;

-- Vuelve públicas las herramientas del catálogo sin dueño (las de los
-- usuarios estándar siguen privadas: el trigger las re-fuerza al pasar).
update public.tools set is_public = true where user_id is null;

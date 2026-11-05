-- ============================================================
-- ToolNest · Configuración del administrador
-- PASO 1: Regístrate en la app con el correo que quieras usar
--         como administrador (ej. admin@tudominio.com).
-- PASO 2: Ejecuta este script en el SQL Editor de Supabase
--         sustituyendo el correo del ejemplo.
-- Hace tres cosas:
--   1) Promueve ese perfil al rol 'admin'.
--   2) Re-asigna las herramientas sembradas (seed) a ese admin,
--      para que el feed público las muestre como "creadas por el admin".
-- ============================================================

-- ⚠️ Sustituye el correo por el de tu cuenta admin:
do $$
declare
  admin_id uuid;
begin
  select id into admin_id from auth.users where email = 'mosher21a@gmail.com';

  if admin_id is null then
    raise exception 'No existe una cuenta con ese correo. Regístrate primero en la app.';
  end if;

  update public.profiles set role = 'admin' where id = admin_id;

  -- Las herramientas sembradas pasan a pertenecer al admin (siguen públicas).
  update public.tools set user_id = admin_id where user_id is null;

  raise notice 'Admin configurado: % (perfil %)', 'mosher21a@gmail.com', admin_id;
end;
$$;

-- ============================================================
-- ToolNest · Migración inicial (v2 — corregida e idempotente)
-- Tablas: profiles (roles) y tools (herramientas) + RLS + triggers
-- Orden corregido: la función is_admin() se crea ANTES de las políticas.
-- Se puede ejecutar varias veces sin errores (todo usa if not exists / or replace).
-- ============================================================

-- ---------- 1. Perfiles y roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------- 2. Helper: ¿es administrador? (ANTES de las políticas) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- 3. Políticas de profiles ----------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- ---------- 4. Crea automáticamente un perfil al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 5. Herramientas ----------
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price text not null,
  url text not null,
  category text not null,
  description_long text,
  competitor text,
  competitor_diffs text,
  signup_steps text,
  user_id uuid references public.profiles (id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tools_public_idx on public.tools (is_public);
create index if not exists tools_user_idx on public.tools (user_id);
create index if not exists tools_category_idx on public.tools (category);

alter table public.tools enable row level security;

-- ---------- 6. Políticas RLS de tools (idempotentes) ----------
drop policy if exists "tools_public_read" on public.tools;
create policy "tools_public_read" on public.tools
  for select using (is_public = true);

drop policy if exists "tools_owner_read" on public.tools;
create policy "tools_owner_read" on public.tools
  for select using (user_id = auth.uid());

drop policy if exists "tools_owner_insert" on public.tools;
create policy "tools_owner_insert" on public.tools
  for insert with check (user_id = auth.uid() and (is_public = false or public.is_admin()));

drop policy if exists "tools_owner_update" on public.tools;
create policy "tools_owner_update" on public.tools
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and (is_public = false or public.is_admin()));

drop policy if exists "tools_owner_delete" on public.tools;
create policy "tools_owner_delete" on public.tools
  for delete using (user_id = auth.uid());

drop policy if exists "tools_admin_public" on public.tools;
create policy "tools_admin_public" on public.tools
  for all using (public.is_admin() and (is_public = true or user_id = auth.uid()))
  with check (public.is_admin());

-- ---------- 7. Visibilidad automática según rol ----------
-- Admin → is_public = true (siempre). Usuario estándar → is_public = false (siempre).
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

drop trigger if exists tools_force_visibility_insert on public.tools;
create trigger tools_force_visibility_insert
  before insert on public.tools
  for each row execute function public.force_visibility();

drop trigger if exists tools_force_visibility_update on public.tools;
create trigger tools_force_visibility_update
  before update on public.tools
  for each row execute function public.force_visibility();

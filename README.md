# ToolNest App

Directorio de herramientas IA full-stack: catálogo público, panel privado con CRUD,
roles (Admin / Usuario estándar), recomendador IA ("¿Qué quieres hacer?"), comparador
lado a lado y páginas de detalle con competidor y registro.

**Stack**: React 19-style con React 18 + TypeScript + Vite · Tailwind CSS v3 · Supabase
(Postgres + Auth + RLS + Edge Functions) · AI Gateway compatible con OpenAI.

---

## 1. Crea el proyecto Supabase

1. Entra en [supabase.com](https://supabase.com) y crea un proyecto (gratis).
2. Abre **SQL Editor** y ejecuta, en orden:
   - `supabase/migrations/0001_init.sql` (tablas, RLS, triggers)
   - `supabase/migrations/0002_seed.sql` (catálogo de 63 herramientas públicas)
3. Copia **Project Settings → API** → *Project URL* y *anon public key*.

## 2. Configura las claves

```bash
cd toolnest
cp .env.example .env
# Edita .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

## 3. Arranca

```bash
npm install
npm run dev
```

Sin claves configuradas la app arranca en **modo demo**: el catálogo se lee de
`src/data/seed-tools.json` y el recomendador local funciona, pero el registro y el
panel privado están desactivados (muestra instrucciones en pantalla).

## 4. Crea la cuenta administradora

1. Arranca la app y regístrate con el correo que será admin (ej. `admin@tudominio.com`).
2. En el **SQL Editor** de Supabase abre `supabase/setup-admin.sql`, sustituye el correo
   del ejemplo por el tuyo y ejecútalo. Esto:
   - promueve tu perfil al rol `admin`;
   - re-asigna el catálogo sembrado a tu cuenta (el inicio lo mostrará como creado por el admin).

> Los usuarios estándar no necesitan nada: al registrarse reciben rol `user` y sus
> herramientas son privadas automáticamente (trigger `force_visibility`).

## 5. Recomendador IA (opcional pero recomendado)

La sección **"¿Qué quieres hacer?"** funciona sin claves (recomendador local por palabras
clave). Para que razone con un modelo real a través de tu **AI Gateway**:

```bash
supabase functions deploy recommend --no-verify-jwt
supabase secrets set \
  AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1 \
  AI_GATEWAY_API_KEY=tu_clave \
  AI_MODEL=openai/gpt-4o-mini
```

La función lee el catálogo público con la service role, pide al modelo un JSON
`{ multi, steps[] }` y **valida los ids contra el catálogo** antes de responder.
Si la gateway no responde o no está configurada, el cliente usa el fallback local.

## 6. Seguridad (RLS) — resumen

| Acción | Usuario estándar | Admin | Visitante |
| --- | --- | --- | --- |
| Ver herramientas públicas | ✅ | ✅ | ✅ |
| Ver herramientas privadas de otros | ❌ | ❌ (privacidad estricta) | ❌ |
| Crear herramientas | ✅ (siempre privadas) | ✅ (siempre públicas) | ❌ |
| Editar/eliminar ajenas | ❌ | Solo las públicas | ❌ |

- `public.is_admin()` (security definer) consulta `profiles.role`.
- Trigger `force_visibility`: al insertar/actualizar fuerza `is_public` según el rol.
- Políticas `with check` impiden a un usuario estándar insertar/actualizar con
  `is_public = true`, incluso manipulando el cliente.

## 7. Estructura

```
toolnest/
├── index.html
├── package.json / vite.config.ts / tailwind.config.js / tsconfig.json
├── .env.example
├── supabase/
│   ├── migrations/0001_init.sql      # tablas + RLS + triggers
│   ├── migrations/0002_seed.sql      # catálogo público (63 herramientas)
│   ├── setup-admin.sql               # promueve a admin + re-asigna el seed
│   └── functions/recommend/index.ts  # Edge Function del recomendador
├── scripts/gen-seed.mjs              # regenera el seed desde el JSON
└── src/
    ├── lib/            # supabase, tipos, recomendador local, catálogo demo
    ├── context/        # AuthContext (sesión + perfil + rol)
    ├── components/     # Navbar, ToolCard, Recommender, ToolForm
    └── pages/          # Home, Auth, Dashboard, ToolDetail, Compare
```

## 8. Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Type-check + build de producción |
| `npm run preview` | Sirve el build |
| `npm run gen:seed` | Regenera `0002_seed.sql` desde `src/data/seed-tools.json` |

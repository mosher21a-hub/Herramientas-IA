# Despliegue de ToolNest — guía paso a paso

Cuenta necesaria: Supabase (ya la tienes) + GitHub o CLI de Vercel para el frontend.
Todo se puede hacer desde tu propio terminal; aquí dejo también los comandos exactos.

---

## Parte 1 — Supabase: proyecto, migraciones y admin

1. **Crea el proyecto**: [supabase.com](https://supabase.com) → *New project* → elige la
   región más cercana y guarda la contraseña de la base de datos.
2. **Ejecuta las migraciones** (SQL Editor, en este orden):
   - `supabase/migrations/0001_init.sql` — tablas, RLS y triggers
   - `supabase/migrations/0002_seed.sql` — catálogo de 63 herramientas públicas
3. **Copia tus claves**: *Project Settings → API*
   - `Project URL` → será `VITE_SUPABASE_URL`
   - `anon public` → será `VITE_SUPABASE_ANON_KEY`
   - `service_role` → **no la uses en el frontend ni la compartas** (solo la usa la
     Edge Function internamente vía `SUPABASE_SERVICE_ROLE_KEY`)

## Parte 2 — Local: `.env`, admin y verificación

```bash
cd toolnest
cp .env.example .env        # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

1. Abre `http://localhost:5173`, entra en **Entrar** y **regístrate** con el correo
   que será administrador (ej. `admin@tudominio.com`).
2. En el **SQL Editor** de Supabase abre `supabase/setup-admin.sql`, sustituye el
   correo del ejemplo por el tuyo y ejecútalo.
3. Recarga la app: verás el badge **Admin** y el catálogo aparece como creado por ti.
   Prueba a crear una herramienta desde el panel — se publica automáticamente.

## Parte 3 — Frontend online (Vercel, gratis)

**Opción A — GitHub (recomendada para iterar)**
1. Sube la carpeta `toolnest/` a un repositorio (sin `node_modules` ni `.env`).
2. [vercel.com](https://vercel.com) → *Add New → Project* → importa el repo.
3. Vercel detecta Vite automáticamente. En **Environment Variables** añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. El `vercel.json` ya incluye el rewrite SPA para que funcionen las
   rutas `/dashboard`, `/tool/:id` y `/compare` al recargar.

**Opción B — CLI**
```bash
npx vercel login
npx vercel --prod
```
(y añade las dos variables de entorno en el dashboard de Vercel o con
`npx vercel env add VITE_SUPABASE_URL`).

**Alternativa Netlify**: build `npm run build`, directorio `dist`, y un archivo
`public/_redirects` con la línea `/* /index.html 200`.

## Parte 4 — Edge Function del recomendador (IA real)

Sin este paso la sección "¿Qué quieres hacer?" usa el recomendador local (funciona,
pero no razona con un modelo). Para conectar tu AI Gateway:

```bash
cd toolnest
npm install -g supabase      # CLI (si no la tienes ya)
supabase login               # abre el navegador para autenticarte
supabase link --project-ref  TU-PROJECT-REF   # está en Project Settings → General
supabase secrets set \
  AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1 \
  AI_GATEWAY_API_KEY=tu_clave_de_gateway \
  AI_MODEL=openai/gpt-4o-mini
supabase functions deploy recommend
```

La app la invoca automáticamente (`supabase.functions.invoke('recommend')`); si la
función no responde, cae al recomendador local sin romper nada.

## Parte 5 — Seguridad, checklist final

- [x] RLS activada en `tools` y `profiles` (usuario estándar solo ve lo suyo + catálogo)
- [x] Trigger `force_visibility`: estándar → privado, admin → público
- [x] `tools_admin_public`: el admin gestiona el catálogo público, **no** las privadas ajenas
- [x] `service_role` solo en el servidor (Edge Function); nunca en el cliente ni en el repo
- [ ] `.env` en `.gitignore` antes de subir a GitHub (ya está, verifícalo)
- [ ] Variables de entorno configuradas en Vercel

## Problemas típicos

| Síntoma | Causa | Solución |
| --- | --- | --- |
| "Conecta Supabase primero" | `.env` sin claves o sin reiniciar `npm run dev` | Rellena `.env` y reinicia el servidor |
| Al recargar `/dashboard` da 404 | Falta el rewrite SPA en el hosting | `vercel.json` incluido; en Netlify añade `public/_redirects` |
| El recomendador dice "recomendador local" | Edge Function sin desplegar o sin `AI_GATEWAY_API_KEY` | Parte 4 de esta guía |
| No soy admin tras el setup | El correo de `setup-admin.sql` no coincide | Sustituye el correo y re-ejecuta el script |

// Genera supabase/migrations/0002_seed.sql a partir de src/data/seed-tools.json
// Uso: npm run gen:seed
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const data = JSON.parse(
  readFileSync(new URL('../src/data/seed-tools.json', import.meta.url), 'utf8'),
)

const esc = (s) => (s ?? '').replace(/'/g, "''")

const rows = data.map(
  (t) =>
    `  ('${esc(t.name)}', '${esc(t.description)}', '${esc(t.price)}', '${esc(t.url)}', '${esc(
      t.category,
    )}', ${t.competitor ? `'${esc(t.competitor)}'` : 'null'}, ${
      t.competitor_diffs ? `'${esc(t.competitor_diffs)}'` : 'null'
    }, true)`,
)

const sql = `-- ============================================================
-- ToolNest · Seed del catálogo público
-- Generado automáticamente por scripts/gen-seed.mjs (${data.length} herramientas).
-- Se insertan como públicas y con user_id NULL; el script setup-admin.sql
-- las re-asigna al administrador después de crear su cuenta.
-- ============================================================

insert into public.tools (name, description, price, url, category, competitor, competitor_diffs, is_public)
values
${rows.join(',\n')}
on conflict do nothing;
`

mkdirSync(new URL('../supabase/migrations/', import.meta.url), { recursive: true })
writeFileSync(new URL('../supabase/migrations/0002_seed.sql', import.meta.url), sql)
console.log(`seed escrito: ${rows.length} herramientas → supabase/migrations/0002_seed.sql`)

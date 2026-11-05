// Comprueba conexión + número de herramientas sembradas.
// Salida: exit 100+N = OK con N herramientas · exit 2 = tabla inexistente
// exit 3 = clave inválida · exit 4 = URL inaccesible · exit 5 = .env incompleto
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'))
  return m ? m[1].trim() : ''
}

const url = get('VITE_SUPABASE_URL').replace(/\/$/, '')
const key = get('VITE_SUPABASE_ANON_KEY')

if (!url || !key) process.exit(5)

try {
  const res = await fetch(`${url}/rest/v1/tools?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
    },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) process.exit(2)
  if (res.status === 401 || res.status === 403) process.exit(3)
  if (res.status !== 200) process.exit(1)

  const range = res.headers.get('content-range') ?? '*/0'
  const total = parseInt(range.split('/')[1] ?? '0', 10) || 0
  process.exit(100 + Math.min(total, 99)) // exit 100 = 0 filas · exit 163 = 63 filas
} catch {
  process.exit(4)
}

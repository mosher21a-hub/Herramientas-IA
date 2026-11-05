import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import seedCatalog from '../data/seed-tools.json'
import ToolCard from '../components/ToolCard'
import Recommender from '../components/Recommender'
import { CATEGORIES } from '../lib/types'
import type { Tool } from '../lib/types'

// Catálogo de demostración (mismo contenido que supabase/migrations/0002_seed.sql)
const demoCatalog = (seedCatalog as unknown as Omit<Tool, 'user_id' | 'is_public'>[]).map((t) => ({
  ...t,
  user_id: null,
  is_public: true,
})) as Tool[]

export default function Home() {
  const navigate = useNavigate()
  const [tools, setTools] = useState<Tool[] | null>(null)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    if (isConfigured) {
      supabase
        .from('tools')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (alive) setTools((data as Tool[]) ?? [])
        })
    } else {
      setTools(demoCatalog)
    }
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!tools) return []
    const q = query.trim().toLowerCase()
    return tools.filter((t) => {
      if (category !== 'all' && t.category !== category) return false
      if (q && !`${t.name} ${t.description} ${t.price}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [tools, category, query])

  function toggleCompare(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 4) return prev // máximo 4 para comparar
      return [...prev, id]
    })
  }

  return (
    <main className="mx-auto max-w-page px-6 pb-24">
      {/* Hero compacto */}
      <section className="py-12 text-center">
        <p className="eyebrow font-mono text-xs uppercase tracking-widest text-terracotta">
          El directorio de herramientas IA
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Encuentra la herramienta de IA adecuada para cada tarea.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-soft dark:text-night-muted">
          {tools
            ? `${tools.length} herramientas públicas seleccionadas a mano. Compara, guarda tus favoritas y pide recomendaciones.`
            : 'Cargando catálogo…'}
        </p>
      </section>

      {!isConfigured && (
        <div className="mb-10 rounded-2xl border border-terracotta/40 bg-terracotta-soft p-4 text-sm">
          <strong>Modo demo.</strong> Estás viendo el catálogo desde datos locales. Para activar
          cuentas, panel privado y tu propio catálogo, conecta Supabase en el archivo{' '}
          <code className="font-mono">.env</code> (ver{' '}
          <Link to="/auth" className="underline">
            instrucciones
          </Link>
          ).
        </div>
      )}

      {/* Requisito 6 y 7: recomendador IA + ¿Qué quieres hacer? */}
      <Recommender tools={tools ?? demoCatalog} />

      {/* Filtros */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Directorio</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar herramientas…"
            aria-label="Buscar herramientas"
            className="w-full rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none dark:border-night-line dark:bg-night-surface dark:text-night-fg sm:w-72"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            aria-current={category === 'all'}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
              category === 'all'
                ? 'border-terracotta text-terracotta dark:border-night-accent dark:text-night-accent'
                : 'border-hairline text-soft hover:border-ink dark:border-night-line dark:text-night-muted'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              aria-current={category === c.value}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                category === c.value
                  ? 'border-terracotta text-terracotta dark:border-night-accent dark:text-night-accent'
                  : 'border-hairline text-soft hover:border-ink dark:border-night-line dark:text-night-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {tools === null ? (
          <p className="mt-8 text-soft dark:text-night-muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-soft dark:text-night-muted">
            No hay herramientas con esos filtros.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                selected={selected.includes(tool.id)}
                onCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </section>

      {/* Barra de comparación (requisito 8) */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
          <button
            onClick={() => navigate(`/compare?ids=${selected.join(',')}`)}
            className="rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-terracotta-dark"
          >
            Comparar {selected.length} herramienta{selected.length > 1 ? 's' : ''} →
          </button>
        </div>
      )}
    </main>
  )
}

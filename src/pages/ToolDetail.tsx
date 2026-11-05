import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import { demoCatalog } from '../lib/demo'
import { CATEGORY_LABEL } from '../lib/types'
import type { Tool } from '../lib/types'

export default function ToolDetail() {
  const { id } = useParams()
  const [tool, setTool] = useState<Tool | 'loading' | 'notfound'>('loading')

  useEffect(() => {
    let alive = true
    if (isConfigured) {
      supabase
        .from('tools')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
        .then(({ data }) => {
          if (alive) setTool((data as Tool) ?? 'notfound')
        })
    } else {
      const found = demoCatalog.find((t) => t.id === id)
      setTool(found ?? 'notfound')
    }
    return () => {
      alive = false
    }
  }, [id])

  if (tool === 'loading') {
    return (
      <main className="mx-auto max-w-page px-6 py-16">
        <p className="text-soft dark:text-night-muted">Cargando…</p>
      </main>
    )
  }

  if (tool === 'notfound') {
    return (
      <main className="mx-auto max-w-page px-6 py-16 text-center">
        <p className="text-soft dark:text-night-muted">
          No encontramos esta herramienta (o es privada y no es tuya).
        </p>
        <Link to="/" className="mt-4 inline-block text-terracotta hover:underline">
          ← Volver al directorio
        </Link>
      </main>
    )
  }

  const long = tool.description_long || tool.description
  const signupSteps: string[] =
    tool.signup_steps?.split('\n').filter(Boolean) ?? [
      `Abre ${tool.name} en su sitio web oficial.`,
      'Crea tu cuenta con tu correo electrónico.',
      `Elige el plan que te convenga (${tool.price}).`,
    ]

  return (
    <main className="mx-auto max-w-page px-6 py-10">
      <Link to="/" className="text-sm text-terracotta hover:underline dark:text-night-accent">
        ← Volver al directorio
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl font-semibold">{tool.name}</h1>
          <span className="rounded-full border border-hairline px-3 py-1 text-xs text-soft dark:border-night-line dark:text-night-muted">
            {CATEGORY_LABEL[tool.category] ?? tool.category}
          </span>
          <span className="rounded-full border border-hairline px-3 py-1 text-xs text-soft dark:border-night-line dark:text-night-muted">
            {tool.price}
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-lg text-soft dark:text-night-muted">{long}</p>
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-xl bg-terracotta px-6 py-3 text-sm font-medium text-white hover:bg-terracotta-dark"
        >
          Abrir {tool.name} ↗
        </a>
      </header>

      {tool.competitor && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Competidor principal</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-hairline bg-surface p-5 dark:border-night-line dark:bg-night-surface">
              <p className="text-xs uppercase tracking-wide text-soft dark:text-night-muted">
                Esta herramienta
              </p>
              <p className="mt-1 font-display text-xl font-semibold">{tool.name}</p>
            </div>
            <div className="rounded-2xl border border-hairline bg-surface p-5 dark:border-night-line dark:bg-night-surface">
              <p className="text-xs uppercase tracking-wide text-soft dark:text-night-muted">
                Competidor principal
              </p>
              <p className="mt-1 font-display text-xl font-semibold">{tool.competitor}</p>
            </div>
          </div>
          {tool.competitor_diffs && (
            <div className="mt-4 rounded-2xl border border-hairline bg-surface p-5 dark:border-night-line dark:bg-night-surface">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-soft dark:text-night-muted">
                Diferencias clave
              </h3>
              <p className="mt-2 text-sm leading-relaxed">{tool.competitor_diffs}</p>
            </div>
          )}
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Cómo registrarte</h2>
        <ol className="mt-4 space-y-3">
          {signupSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terracotta font-display text-sm font-semibold text-white">
                {i + 1}
              </span>
              <p className="pt-1.5 text-sm">{step}</p>
            </li>
          ))}
        </ol>
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block rounded-xl border border-hairline px-5 py-2.5 text-sm hover:border-ink dark:border-night-line dark:hover:border-night-fg"
        >
          Ir a {tool.url.replace(/^https?:\/\//, '')} ↗
        </a>
      </section>
    </main>
  )
}

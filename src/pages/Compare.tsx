import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import { demoCatalog } from '../lib/demo'
import { CATEGORY_LABEL } from '../lib/types'
import type { Tool } from '../lib/types'

export default function Compare() {
  const [params] = useSearchParams()
  const ids = (params.get('ids') ?? '')
    .split(',')
    .filter(Boolean)
    .slice(0, 4)

  const [tools, setTools] = useState<Tool[] | null>(null)

  useEffect(() => {
    let alive = true
    if (ids.length === 0) {
      setTools([])
      return () => {
        alive = false
      }
    }
    if (isConfigured) {
      supabase
        .from('tools')
        .select('*')
        .in('id', ids)
        .then(({ data }) => {
          if (alive) setTools((data as Tool[]) ?? [])
        })
    } else {
      setTools(demoCatalog.filter((t) => ids.includes(t.id)))
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <main className="mx-auto max-w-page px-6 py-10">
      <Link to="/" className="text-sm text-terracotta hover:underline dark:text-night-accent">
        ← Volver al directorio
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold">Comparar herramientas</h1>

      {tools === null ? (
        <p className="mt-6 text-soft dark:text-night-muted">Cargando…</p>
      ) : tools.length < 2 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-hairline p-8 text-center text-soft dark:border-night-line dark:text-night-muted">
          Elige al menos dos herramientas en el directorio (casilla «Comparar») para verlas lado a
          lado.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-hairline dark:border-night-line">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface dark:border-night-line dark:bg-night-surface">
                <th className="w-36 p-4 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-soft dark:text-night-muted">
                  Comparando
                </th>
                {tools.map((t) => (
                  <th key={t.id} className="p-4 text-left align-top">
                    <Link to={`/tool/${t.id}`} className="font-display text-lg font-semibold hover:text-terracotta">
                      {t.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] font-normal uppercase tracking-wide text-soft dark:text-night-muted">
                      {CATEGORY_LABEL[t.category] ?? t.category}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Precio', (t: Tool) => t.price],
                ['Descripción', (t: Tool) => t.description],
                ['Competidor', (t: Tool) => t.competitor ?? '—'],
                [
                  'Diferencias',
                  (t: Tool) => t.competitor_diffs ?? 'Sin registro de diferencias por ahora.',
                ],
              ].map(([label, render]) => (
                <tr key={label as string} className="border-b border-hairline dark:border-night-line">
                  <th scope="row" className="p-4 text-left align-top font-mono text-[11px] font-normal uppercase tracking-wide text-soft dark:text-night-muted">
                    {label as string}
                  </th>
                  {tools.map((t) => (
                    <td key={t.id} className="p-4 align-top">
                      {(render as (t: Tool) => string)(t)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-surface dark:bg-night-surface">
                <th scope="row" className="p-4 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-soft dark:text-night-muted">
                  Enlace
                </th>
                {tools.map((t) => (
                  <td key={t.id} className="p-4">
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-terracotta px-4 py-2 text-xs font-medium text-white hover:bg-terracotta-dark"
                    >
                      Abrir {t.name} ↗
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

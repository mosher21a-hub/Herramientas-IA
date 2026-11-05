import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import { heuristicRecommend } from '../lib/recommend'
import type { RecStep } from '../lib/recommend'
import type { Tool } from '../lib/types'

interface Props {
  tools: Tool[]
}

export default function Recommender({ tools }: Props) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ multi: boolean; steps: RecStep[]; source: 'ia' | 'local' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function recommend() {
    if (goal.trim().length < 3) {
      setError('Describe tu objetivo (mínimo 3 caracteres).')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)

    let steps: RecStep[] | null = null
    let multi = false
    let source: 'ia' | 'local' = 'local'

    // 1) Edge Function + AI Gateway (claves en el servidor)
    if (isConfigured) {
      try {
        const { data, error } = await supabase.functions.invoke('recommend', {
          body: { goal },
        })
        if (!error && data && Array.isArray(data.steps) && data.steps.length > 0) {
          steps = data.steps as RecStep[]
          multi = Boolean(data.multi)
          source = 'ia'
        }
      } catch {
        // red o función no desplegada → fallback local
      }
    }

    // 2) Recomendador local por palabras clave
    if (!steps) {
      const local = heuristicRecommend(goal, tools)
      steps = local.steps
      multi = local.multi
    }

    setLoading(false)
    setResult({ multi, steps: steps!, source })
  }

  const byId = new Map(tools.map((t) => [t.id, t]))

  return (
    <section id="recomendador" className="scroll-mt-20">
      <div className="rounded-2xl border border-hairline bg-surface p-6 dark:border-night-line dark:bg-night-surface">
        <h2 className="font-display text-2xl font-semibold">¿Qué quieres hacer?</h2>
        <p className="mt-1 text-sm text-soft dark:text-night-muted">
          Describe tu objetivo y te recomendamos las herramientas del directorio. Si la tarea es
          compleja, te proponemos varias herramientas en el orden en que usarlas.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) recommend()
            }}
            rows={2}
            placeholder='Ej. «Quiero grabar una reunión, transcribirla y hacer un resumen para mi equipo»'
            className="flex-1 resize-y rounded-xl border border-hairline bg-paper px-4 py-3 text-sm focus:border-terracotta focus:outline-none dark:border-night-line dark:bg-night-bg dark:text-night-fg"
          />
          <button
            onClick={recommend}
            disabled={loading}
            className="h-fit rounded-xl bg-terracotta px-5 py-3 text-sm font-medium text-white transition hover:bg-terracotta-dark disabled:opacity-50"
          >
            {loading ? 'Pensando…' : 'Recomendar con IA'}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!error && !loading && !result && (
          <p className="mt-2 text-xs text-soft dark:text-night-muted">
            {isConfigured
              ? 'Usamos una IA a través del AI Gateway; si no está configurada, un recomendador local toma el relevo.'
              : 'Modo demo: el recomendador local funciona sin configurar Supabase.'}
          </p>
        )}

        {result && result.steps.length === 0 && (
          <p className="mt-4 text-sm text-soft dark:text-night-muted">
            No encontramos herramientas que coincidan. Prueba describir tu objetivo con otras
            palabras.
          </p>
        )}

        {result && result.steps.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-soft dark:text-night-muted">
              {result.multi
                ? 'Tarea compleja — sigue estos pasos en orden'
                : 'Nuestra recomendación'}{' '}
              <span className="normal-case">({result.source === 'ia' ? 'IA' : 'recomendador local'})</span>
            </p>
            <ol className="space-y-3">
              {result.steps.map((step) => {
                const tool = byId.get(step.id)
                if (!tool) return null
                return (
                  <li
                    key={step.id}
                    className="flex items-start gap-4 rounded-xl border border-hairline bg-paper p-4 dark:border-night-line dark:bg-night-bg"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-terracotta font-display text-sm font-semibold text-white">
                      {step.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          to={`/tool/${tool.id}`}
                          className="font-semibold hover:text-terracotta dark:hover:text-night-accent"
                        >
                          {tool.name}
                        </Link>
                        <span className="rounded-full border border-hairline px-2 py-0.5 text-[11px] text-soft dark:border-night-line dark:text-night-muted">
                          {tool.price}
                        </span>
                      </div>
                      {step.reason && (
                        <p className="mt-0.5 text-sm text-soft dark:text-night-muted">{step.reason}</p>
                      )}
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[13px] font-medium text-terracotta hover:underline dark:text-night-accent"
                      >
                        Abrir {tool.name} ↗
                      </a>
                    </div>
                  </li>
                )
              })}
            </ol>
            {result.multi && (
              <p className="mt-3 text-xs text-soft dark:text-night-muted">
                Usa las herramientas en el orden indicado: la salida de cada paso alimenta al
                siguiente.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

import type { Tool } from './types'

export interface RecStep {
  order: number
  id: string
  reason?: string
}

export interface RecResult {
  multi: boolean
  steps: RecStep[]
  source: 'ia' | 'local'
}

const STOP = new Set(
  'de la el los las un una unos unas y o u para con que mi mis tu tus me quiero necesito busca buscar herramientas herramienta ia app apps obtener hacer lograr poder pueda usar usando gratis de pago freemium'.split(
    ' ',
  ),
)

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Recomendador local (fallback sin AI Gateway): puntúa cada herramienta por
 * la coincidencia de palabras clave del objetivo con su nombre, descripción
 * y categoría. Si el objetivo parece complejo (muchas palabras clave o
 * conectores de secuencia), devuelve varias herramientas ordenadas.
 */
export function heuristicRecommend(goal: string, tools: Tool[]): RecResult {
  const raw = norm(goal)
  const words = raw.split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2 && !STOP.has(w))

  const scored = tools
    .map((t) => {
      const hay = norm(`${t.name} ${t.description} ${t.category}`)
      const matched: string[] = []
      for (const w of words) {
        if (hay.includes(w)) matched.push(w)
      }
      return { tool: t, score: matched.length, matched }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const sequenceHint = /(luego|despues|después|entonces|primero|finalmente|ademas|además)/.test(raw)
  const multi = (sequenceHint && scored.length >= 2) || (words.length >= 4 && scored.length >= 3)

  const picked = (multi ? scored.slice(0, 4) : scored.slice(0, 1)).map((s, i) => ({
    order: i + 1,
    id: s.tool.id,
    reason:
      s.matched.length > 0
        ? `Coincide con: ${s.matched.slice(0, 3).join(', ')}`
        : 'Recomendada para tu objetivo.',
  }))

  return { multi, steps: picked, source: 'local' }
}

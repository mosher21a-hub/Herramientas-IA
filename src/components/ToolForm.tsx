import { useState } from 'react'
import { CATEGORIES } from '../lib/types'
import type { Tool, ToolInput } from '../lib/types'

interface Props {
  initial?: Tool | null
  submitLabel: string
  onSubmit: (input: ToolInput) => Promise<string | null>
  onCancel?: () => void
}

interface Errors {
  name?: string
  description?: string
  price?: string
  url?: string
  category?: string
}

function validate(input: ToolInput): Errors {
  const errors: Errors = {}
  if (input.name.trim().length < 3) errors.name = 'El nombre necesita al menos 3 caracteres.'
  if (input.description.trim().length < 10)
    errors.description = 'La descripción necesita al menos 10 caracteres.'
  if (!input.price.trim()) errors.price = 'Indica el precio o modelo de precios.'
  try {
    const u = new URL(input.url.trim())
    if (!/^https?:$/.test(u.protocol)) errors.url = 'La URL debe empezar por http:// o https://'
  } catch {
    errors.url = 'Introduce una URL válida (ej. https://ejemplo.com).'
  }
  if (!CATEGORIES.some((c) => c.value === input.category)) errors.category = 'Elige una categoría.'
  return errors
}

export default function ToolForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [input, setInput] = useState<ToolInput>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? '',
    url: initial?.url ?? 'https://',
    category: initial?.category ?? '',
    description_long: initial?.description_long ?? '',
    competitor: initial?.competitor ?? '',
    competitor_diffs: initial?.competitor_diffs ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof ToolInput>(key: K, value: ToolInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean: ToolInput = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price.trim(),
      url: input.url.trim(),
      description_long: input.description_long?.trim() || undefined,
      competitor: input.competitor?.trim() || undefined,
      competitor_diffs: input.competitor_diffs?.trim() || undefined,
    }
    const errs = validate(clean)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const error = await onSubmit(clean)
    setSaving(false)
    if (error) setServerError(error)
  }

  const field =
    'w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none dark:border-night-line dark:bg-night-bg dark:text-night-fg'
  const label = 'mb-1 block text-xs font-medium uppercase tracking-wide text-soft dark:text-night-muted'
  const err = 'mt-1 text-xs text-red-600 dark:text-red-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {serverError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tf-name" className={label}>
            Nombre *
          </label>
          <input
            id="tf-name"
            className={field}
            value={input.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ej. Gamma"
          />
          {errors.name && <p className={err}>{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="tf-price" className={label}>
            Precio *
          </label>
          <input
            id="tf-price"
            className={field}
            value={input.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="Ej. Freemium, De pago, $12/mes…"
          />
          {errors.price && <p className={err}>{errors.price}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="tf-desc" className={label}>
          Descripción corta *
        </label>
        <textarea
          id="tf-desc"
          rows={2}
          className={field}
          value={input.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Una o dos frases sobre para qué sirve."
        />
        {errors.description && <p className={err}>{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tf-url" className={label}>
            Enlace URL *
          </label>
          <input
            id="tf-url"
            type="url"
            className={field}
            value={input.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://…"
          />
          {errors.url && <p className={err}>{errors.url}</p>}
        </div>
        <div>
          <label htmlFor="tf-cat" className={label}>
            Categoría *
          </label>
          <select
            id="tf-cat"
            className={field}
            value={input.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="">Elige una categoría…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && <p className={err}>{errors.category}</p>}
        </div>
      </div>

      <details className="rounded-xl border border-hairline p-4 dark:border-night-line">
        <summary className="cursor-pointer text-sm font-medium">
          Detalle completo, competidor y registro (opcional)
        </summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="tf-long" className={label}>
              Descripción completa
            </label>
            <textarea
              id="tf-long"
              rows={3}
              className={field}
              value={input.description_long}
              onChange={(e) => set('description_long', e.target.value)}
              placeholder="Qué hace, para quién y qué la diferencia."
            />
          </div>
          <div>
            <label htmlFor="tf-comp" className={label}>
              Competidor principal
            </label>
            <input
              id="tf-comp"
              className={field}
              value={input.competitor}
              onChange={(e) => set('competitor', e.target.value)}
              placeholder="Ej. ChatGPT"
            />
          </div>
          <div>
            <label htmlFor="tf-diff" className={label}>
              Diferencias clave frente al competidor
            </label>
            <textarea
              id="tf-diff"
              rows={2}
              className={field}
              value={input.competitor_diffs}
              onChange={(e) => set('competitor_diffs', e.target.value)}
              placeholder="Qué hace mejor cada uno."
            />
          </div>
        </div>
      </details>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-dark disabled:opacity-50"
        >
          {saving ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-hairline px-5 py-2.5 text-sm hover:border-ink dark:border-night-line dark:hover:border-night-fg"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

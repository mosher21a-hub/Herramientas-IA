import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isConfigured, supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ToolForm from '../components/ToolForm'
import { CATEGORY_LABEL } from '../lib/types'
import type { Tool, ToolInput } from '../lib/types'

export default function Dashboard() {
  const { session, profile, isAdmin } = useAuth()
  const [tools, setTools] = useState<Tool[] | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tool | null>(null)
  const [opError, setOpError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    let query = supabase.from('tools').select('*').order('created_at', { ascending: true })
    if (!isAdmin) query = query.eq('user_id', session.user.id)
    const { data } = await query
    setTools((data as Tool[]) ?? [])
    setLoading(false)
  }, [session, isAdmin])

  useEffect(() => {
    if (isConfigured && session) load()
  }, [isConfigured, session, isAdmin, load])

  async function handleCreate(input: ToolInput): Promise<string | null> {
    const { error } = await supabase
      .from('tools')
      .insert({ ...input, user_id: session!.user.id })
    if (error) return error.message
    setFormOpen(false)
    await load()
    return null
  }

  async function handleUpdate(input: ToolInput): Promise<string | null> {
    if (!editing) return null
    const { error } = await supabase.from('tools').update(input).eq('id', editing.id)
    if (error) return error.message
    setEditing(null)
    setFormOpen(false)
    await load()
    return null
  }

  async function handleDelete(tool: Tool) {
    if (!window.confirm(`¿Eliminar «${tool.name}»? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('tools').delete().eq('id', tool.id)
    if (error) setOpError(error.message)
    else await load()
  }

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-page px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-hairline bg-surface p-6 dark:border-night-line dark:bg-night-surface">
          <h1 className="font-display text-2xl font-semibold">Panel privado</h1>
          <p className="mt-2 text-sm text-soft dark:text-night-muted">
            El panel privado necesita Supabase configurado (archivo{' '}
            <code className="font-mono">.env</code>). Sigue los pasos del aviso en la página de{' '}
            <Link to="/auth" className="underline">
              acceso
            </Link>{' '}
            o del README.
          </p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-page px-6 py-16 text-center">
        <p className="text-soft dark:text-night-muted">Inicia sesión para ver tu panel.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-page px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {isAdmin ? 'Administración del directorio' : 'Mi panel privado'}
          </h1>
          <p className="mt-1 text-sm text-soft dark:text-night-muted">
            {isAdmin
              ? 'Eres administrador: las herramientas que añadas se publican automáticamente en el inicio.'
              : 'Tus herramientas son privadas: solo tú puedes verlas, editarlas o eliminarlas.'}
          </p>
        </div>
        {!formOpen && (
          <button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className="rounded-xl bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-dark"
          >
            + Nueva herramienta
          </button>
        )}
      </div>

      {opError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {opError}
        </p>
      )}

      {formOpen && (
        <div className="mt-6 rounded-2xl border border-hairline bg-surface p-6 dark:border-night-line dark:bg-night-surface">
          <h2 className="mb-4 font-display text-xl font-semibold">
            {editing ? `Editar «${editing.name}»` : 'Nueva herramienta'}
          </h2>
          <ToolForm
            initial={editing}
            submitLabel={editing ? 'Guardar cambios' : 'Añadir herramienta'}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              setFormOpen(false)
              setEditing(null)
              setOpError(null)
            }}
          />
        </div>
      )}

      <div className="mt-8">
        {tools === null || loading ? (
          <p className="text-soft dark:text-night-muted">Cargando…</p>
        ) : tools.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-soft dark:border-night-line dark:text-night-muted">
            Aún no tienes herramientas. Añade la primera con el botón de arriba.
          </p>
        ) : (
          <ul className="space-y-3">
            {tools.map((tool) => (
              <li
                key={tool.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 dark:border-night-line dark:bg-night-surface"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{tool.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        tool.is_public
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'bg-terracotta-soft text-terracotta dark:text-night-accent'
                      }`}
                    >
                      {tool.is_public ? 'Pública' : 'Privada'}
                    </span>
                  </div>
                  <p className="truncate text-sm text-soft dark:text-night-muted">
                    {CATEGORY_LABEL[tool.category] ?? tool.category} · {tool.price}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(tool)
                      setFormOpen(true)
                      setOpError(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="rounded-lg border border-hairline px-3 py-1.5 text-sm hover:border-ink dark:border-night-line dark:hover:border-night-fg"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tool)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

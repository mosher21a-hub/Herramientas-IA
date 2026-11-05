import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const field =
    'w-full rounded-xl border border-hairline bg-paper px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none dark:border-night-line dark:bg-night-bg dark:text-night-fg'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Introduce un correo válido.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña necesita al menos 8 caracteres.')
      return
    }

    setBusy(true)
    if (mode === 'login') {
      const err = await signIn(email, password)
      setBusy(false)
      if (err) {
        setError(
          /invalid login/i.test(err)
            ? 'Correo o contraseña incorrectos.'
            : /not confirmed/i.test(err)
              ? 'Confirma tu correo con el enlace que te enviamos.'
              : err,
        )
      } else {
        navigate('/dashboard')
      }
    } else {
      const err = await signUp(email, password)
      setBusy(false)
      if (err === 'CHECK_EMAIL') {
        setNotice('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
      } else if (err) {
        setError(err)
      } else {
        navigate('/dashboard')
      }
    }
  }

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-page px-6 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-hairline bg-surface p-6 dark:border-night-line dark:bg-night-surface">
          <h1 className="font-display text-2xl font-semibold">Conecta Supabase primero</h1>
          <p className="mt-2 text-sm text-soft dark:text-night-muted">
            El registro y el panel privado necesitan un proyecto Supabase. Pasos rápidos:
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-soft dark:text-night-muted">
            <li>Crea un proyecto en supabase.com (gratis).</li>
            <li>
              Ejecuta las migraciones <code className="font-mono">0001_init.sql</code> y{' '}
              <code className="font-mono">0002_seed.sql</code> en el SQL Editor.
            </li>
            <li>
              Copia <code className="font-mono">.env.example</code> a{' '}
              <code className="font-mono">.env</code> y rellena URL y clave anónima.
            </li>
            <li>
              Reinicia <code className="font-mono">npm run dev</code>.
            </li>
          </ol>
          <Link to="/" className="mt-5 inline-block text-sm text-terracotta hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-page px-6 py-16">
      <div className="mx-auto max-w-md rounded-2xl border border-hairline bg-surface p-6 dark:border-night-line dark:bg-night-surface">
        <div className="mb-6 flex rounded-xl border border-hairline p-1 dark:border-night-line">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError(null)
                setNotice(null)
              }}
              aria-current={mode === m}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                mode === m
                  ? 'bg-terracotta text-white'
                  : 'text-soft hover:text-ink dark:text-night-muted dark:hover:text-night-fg'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs font-medium text-soft dark:text-night-muted">
              Correo electrónico
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label htmlFor="auth-pass" className="mb-1 block text-xs font-medium text-soft dark:text-night-muted">
              Contraseña
            </label>
            <input
              id="auth-pass"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {notice && (
            <p className="rounded-xl border border-terracotta/40 bg-terracotta-soft p-3 text-sm">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-terracotta px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-dark disabled:opacity-50"
          >
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-xs text-soft dark:text-night-muted">
          Las cuentas nuevas son de rol «Usuario». El rol «Administrador» se asigna ejecutando{' '}
          <code className="font-mono">setup-admin.sql</code> (ver README).
        </p>
      </div>
    </main>
  )
}

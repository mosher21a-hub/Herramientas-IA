import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M17.7 6.3l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M20 13A8 8 0 1 1 11 4a7 7 0 0 0 9 9z" />
    </svg>
  )
}

export default function Navbar() {
  const { session, profile, isAdmin, signOut } = useAuth()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('toolnest.theme', next ? 'dark' : 'light')
    } catch {
      /* almacenamiento no disponible */
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-paper/90 backdrop-blur dark:border-night-line dark:bg-night-bg/90">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight">
          ToolNest
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-soft dark:text-night-muted sm:flex">
          <NavLink to="/" className="hover:text-ink dark:hover:text-night-fg">
            Inicio
          </NavLink>
          <a href="#recomendador" className="hover:text-ink dark:hover:text-night-fg">
            ¿Qué quieres hacer?
          </a>
          {session && (
            <NavLink to="/dashboard" className="hover:text-ink dark:hover:text-night-fg">
              {isAdmin ? 'Administración' : 'Mi panel'}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {session && (
            <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[11px] uppercase text-soft dark:border-night-line dark:text-night-muted">
              {isAdmin ? 'Admin' : 'Usuario'}
            </span>
          )}
          <button
            onClick={toggleTheme}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="grid h-9 w-9 place-items-center rounded-lg border border-hairline text-soft hover:border-ink hover:text-ink dark:border-night-line dark:text-night-muted dark:hover:text-night-fg"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          {session ? (
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-hairline px-3 py-2 text-sm hover:border-ink dark:border-night-line dark:hover:border-night-fg"
            >
              Salir
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg border border-hairline px-3 py-2 text-sm hover:border-ink dark:border-night-line dark:hover:border-night-fg"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

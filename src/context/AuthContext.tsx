import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: current },
    } = await supabase.auth.getSession()
    if (!current?.user) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', current.user.id)
      .single()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) refreshProfile()
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) refreshProfile()
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [refreshProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (!data.session) return 'CHECK_EMAIL'
    return null
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

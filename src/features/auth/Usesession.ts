import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface SessionState {
  session: Session | null
  loading: boolean
}

/**
 * Sesión actual de Supabase Auth.
 *
 * `loading` es true hasta que Supabase recupera la sesión guardada en el
 * navegador; evita mostrar "Iniciar sesión" por un instante a quien ya
 * tiene sesión. Supabase la persiste, así sobrevive a recargar la página.
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    // Se dispara al cargar y en cada inicio o cierre de sesión.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session: state.session,
    user: state.session?.user ?? null,
    loading: state.loading,
  }
}
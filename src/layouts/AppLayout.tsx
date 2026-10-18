import { useEffect, useState } from 'react'
import { Map, MapPinned, University, UserRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

const navigation = [
  { label: 'Inicio', to: '/', icon: University, end: true },
  { label: 'Mapa', to: '/mapa', icon: Map },
  { label: 'Eventos', to: '/eventos', icon: MapPinned },
]

export function AppLayout() {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const syncUserName = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user

      if (!currentUser) {
        setUserName('')
        setIsLoggedIn(false)
        return
      }

      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle()

      const nextName =
        profile?.full_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Usuario'

      setUserName(nextName)
    }

    void syncUserName()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user

      if (!currentUser) {
        setUserName('')
        setIsLoggedIn(false)
        return
      }

      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle()

      const nextName =
        profile?.full_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split('@')[0] ||
        'Usuario'

      setUserName(nextName)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-card px-4 py-6 lg:flex">
        <NavBrand />
        <nav aria-label="Navegación principal" className="mt-10 space-y-1">
          {navigation.map((item) => <NavigationLink key={item.to} {...item} />)}
        </nav>
        <div className="mt-auto rounded-xl bg-accent p-4">
          <p className="text-sm font-medium text-accent-foreground">CampusMap</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Tu campus, más fácil de explorar.</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden"><NavBrand compact /></div>
          <div className="ml-auto flex items-center gap-3">
            {isLoggedIn ? (
              <span className="text-sm font-medium text-foreground">{userName}</span>
            ) : null}
            <NavLink
              to={isLoggedIn ? '/login' : '/login'}
              onClick={(event) => {
                if (isLoggedIn) {
                  event.preventDefault()
                  void handleLogout()
                }
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <UserRound className="size-4" aria-hidden="true" />
              <span>{isLoggedIn ? 'Cerrar sesión' : 'Iniciar sesión'}</span>
            </NavLink>
          </div>
        </header>
        <main className="pb-24 lg:pb-10"><Outlet /></main>
      </div>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t bg-card/95 px-2 py-2 backdrop-blur lg:hidden">
        {navigation.map((item) => <NavigationLink key={item.to} {...item} mobile />)}
      </nav>
    </div>
  )
}

function NavBrand({ compact = false }: { compact?: boolean }) {
  return <NavLink to="/" className="flex items-center gap-3" aria-label="Ir al inicio de CampusMap">
    <img src="/logo_uao.png" alt="UAO" className="h-9 w-14 shrink-0 rounded-lg object-contain" />
    <span className={compact ? 'text-base font-semibold tracking-tight' : 'text-lg font-semibold tracking-tight'}>Campus<span className="text-primary">Map</span></span>
  </NavLink>
}

function NavigationLink({ label, to, icon: Icon, end, mobile = false }: (typeof navigation)[number] & { mobile?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${mobile ? 'flex-col gap-1 text-xs' : ''}`}>
    <Icon className={mobile ? 'size-5' : 'size-4'} aria-hidden="true" /><span>{label}</span>
  </NavLink>
}

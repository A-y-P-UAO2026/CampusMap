import { Map, MapPinned, Search, University, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

const navigation = [
  { label: 'Inicio', to: '/', icon: University, end: true },
  { label: 'Mapa', to: '/mapa', icon: Map },
  { label: 'Eventos', to: '/eventos', icon: MapPinned },
]

export function AppLayout() {
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
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><Search className="size-4" aria-hidden="true" /><span>Explora tu campus</span></div>
          <NavLink to="/login" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><UserRound className="size-4" aria-hidden="true" /><span>Iniciar sesión</span></NavLink>
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
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><MapPinned className="size-5" aria-hidden="true" /></span>
    <span className={compact ? 'text-base font-semibold tracking-tight' : 'text-lg font-semibold tracking-tight'}>Campus<span className="text-primary">Map</span></span>
  </NavLink>
}

function NavigationLink({ label, to, icon: Icon, end, mobile = false }: (typeof navigation)[number] & { mobile?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors lg:justify-start ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${mobile ? 'flex-col gap-1 text-xs' : ''}`}>
    <Icon className={mobile ? 'size-5' : 'size-4'} aria-hidden="true" /><span>{label}</span>
  </NavLink>
}

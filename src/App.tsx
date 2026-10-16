import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { EventsPage } from '@/pages/EventsPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RegisterPage } from '@/pages/RegisterPage'

const MapPage = lazy(() => import('@/pages/MapPage').then((module) => ({ default: module.MapPage })))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="mapa" element={<Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">Cargando mapa…</p>}><MapPage /></Suspense>} />
          <Route path="eventos" element={<EventsPage />} />
          <Route path="eventos/:id" element={<EventDetailPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

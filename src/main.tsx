import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './features/auth/Authprovider'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './App.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
  <StrictMode>
    <App />
  </StrictMode>,
  </AuthProvider>
)

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowLeftRight, MapPinned, Play, RotateCcw, Search, Square } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CampusLeafletMap } from '@/features/map/components/CampusLeafletMap'
import { attachNavigationGeometry } from '@/features/map/lib/navigation-geometry'
import type { MapNetwork } from '@/features/map/lib/navigation-geometry'
import { LocationSearchIndex } from '@/features/map/lib/location-search'
import { LocationHistory } from '@/features/map/lib/location-history'
import { buildCampusGraph, planCampusRoute } from '@/features/map/lib/route-planner'
import type { PlannedRoute } from '@/features/map/lib/route-planner'
import type { Graph } from '@/structures/Graph'

export function MapPage() {
  const [query, setQuery] = useState('')
  const [history] = useState(() => new LocationHistory())
  const [selectedId, setSelectedId] = useState<string>()
  const [focusToken, setFocusToken] = useState(0)
  const [network, setNetwork] = useState<MapNetwork | null>(null)
  const [graph, setGraph] = useState<Graph<string> | null>(null)
  const [originId, setOriginId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [route, setRoute] = useState<PlannedRoute | null>(null)
  const [animationStatus, setAnimationStatus] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [playbackKey, setPlaybackKey] = useState(0)
  const [routeMessage, setRouteMessage] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true
    // The client is loaded inside the effect so missing environment variables
    // are reported in the page instead of preventing the app from rendering.
    async function load() {
      try {
        const { fetchUaoNavigationNetwork } = await import('@/services/locations')
        const rows = await fetchUaoNavigationNetwork()
        const mapped = attachNavigationGeometry(rows.locations, rows.paths)
        const loadedGraph = buildCampusGraph(rows.locations, rows.paths)
        if (active) { setNetwork(mapped); setGraph(loadedGraph); setStatus('ready') }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Error desconocido')
          setStatus('error')
        }
      }
    }
    void load()
    return () => { active = false }
  }, [reloadToken])

  const places = network?.locations.filter((location) => location.is_public && location.kind === 'poi') ?? []
  const searchIndex = useMemo(() => new LocationSearchIndex(network?.locations ?? []), [network])
  const selectedLocation = places.find((place) => place.id === selectedId)
  const connectedIds = useMemo(() => new Set(network?.paths.flatMap((path) =>
    [path.from_location_id, path.to_location_id]) ?? []), [network])
  const visiblePlaces = query.trim() ? searchIndex.suggest(query) : places
  const clearRoute = () => { setRoute(null); setRouteMessage(''); setAnimationStatus('idle') }
  const finishAnimation = useCallback(() => setAnimationStatus('finished'), [])
  const toggleAnimation = () => {
    if (animationStatus === 'playing') {
      setAnimationStatus('idle')
      return
    }
    setPlaybackKey((value) => value + 1)
    setAnimationStatus('playing')
  }
  const reload = () => {
    clearRoute()
    history.clear()
    setOriginId('')
    setDestinationId('')
    setSelectedId(undefined)
    setNetwork(null)
    setGraph(null)
    setStatus('loading')
    setReloadToken((value) => value + 1)
  }
  const consultLocation = (id: string, name: string) => {
    history.visit(id)
    setSelectedId(id)
    setQuery(name)
    setFocusToken((value) => value + 1)
  }
  const goBack = () => {
    const previousId = history.back()
    if (previousId === undefined) return
    const previousPlace = places.find((place) => place.id === previousId)
    if (!previousPlace) return
    setSelectedId(previousId)
    setQuery(previousPlace.name)
    setFocusToken((value) => value + 1)
  }
  const calculateRoute = () => {
    clearRoute()
    if (!originId || !destinationId) {
      setRouteMessage('Selecciona un origen y un destino antes de calcular la ruta.')
      return
    }
    if (!network || !graph) return
    try {
      const planned = planCampusRoute(network, graph, originId, destinationId)
      if (!planned.result.reachable) {
        setRouteMessage(!connectedIds.has(originId) || !connectedIds.has(destinationId)
          ? 'Una de las ubicaciones no tiene conexión peatonal disponible en este mapa.'
          : 'No existe un recorrido entre las ubicaciones seleccionadas.')
        return
      }
      setRoute(planned)
      setSelectedId(undefined)
    } catch (error) {
      setRouteMessage(error instanceof Error ? error.message : 'No se pudo calcular la ruta.')
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Badge variant="secondary" className="mb-4">Mapa</Badge>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mapa del campus</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Explora lugares de la UAO y la red peatonal cargada desde Supabase.
      </p>

      {status === 'loading' && (
        <Card className="mt-8"><CardContent className="py-8 text-sm text-muted-foreground" role="status">
          Cargando ubicaciones y senderos…
        </CardContent></Card>
      )}
      {status === 'error' && (
        <Card className="mt-8"><CardContent className="space-y-3 py-8" role="alert">
          <p className="font-medium">No se pudo cargar el mapa desde Supabase.</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button variant="outline" onClick={reload}>
            Reintentar
          </Button>
        </CardContent></Card>
      )}
      {status === 'ready' && network && places.length === 0 && (
        <Card className="mt-8"><CardContent className="space-y-3 py-8" role="status">
          <p className="font-medium">No hay ubicaciones UAO en la base de datos configurada.</p>
          <p className="text-sm text-muted-foreground">Carga la semilla en Supabase local y verifica que el frontend use su URL y clave pública.</p>
          <Button variant="outline" onClick={reload}>
            Volver a consultar
          </Button>
        </CardContent></Card>
      )}

      {status === 'ready' && network && graph && places.length > 0 && (
        <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <Card className="order-1 min-w-0 lg:h-fit">
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-3">
                <h2 className="text-base font-semibold">Planifica tu recorrido</h2>
                <div className="space-y-1.5">
                  <label htmlFor="route-origin" className="text-sm font-medium">Origen</label>
                  <select id="route-origin" value={originId} onChange={(event) => { setOriginId(event.target.value); clearRoute() }}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Selecciona el origen</option>
                    {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                  </select>
                </div>
                <Button type="button" variant="outline" onClick={() => {
                  setOriginId(destinationId)
                  setDestinationId(originId)
                  clearRoute()
                }} className="min-h-11 w-full" aria-label="Intercambiar origen y destino">
                  <ArrowLeftRight aria-hidden="true" /> Intercambiar
                </Button>
                <div className="space-y-1.5">
                  <label htmlFor="route-destination" className="text-sm font-medium">Destino</label>
                  <select id="route-destination" value={destinationId} onChange={(event) => { setDestinationId(event.target.value); clearRoute() }}
                    className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Selecciona el destino</option>
                    {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
                  </select>
                </div>
                <Button type="button" onClick={calculateRoute} className="min-h-11 w-full">Calcular ruta</Button>
                {routeMessage && <p className="text-sm text-destructive" role="alert">{routeMessage}</p>}
                {route && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm" role="status" aria-live="polite">
                  <p className="mb-1 text-muted-foreground">A · {places.find((place) => place.id === route.result.path[0])?.name} → B · {places.find((place) => place.id === route.result.path.at(-1))?.name}</p>
                  <p className="font-medium">Distancia aproximada: {new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(route.result.distance)} m</p>
                  {route.result.path.length === 1 && <p className="mt-1 text-muted-foreground">El origen y el destino son el mismo lugar.</p>}
                  {route.segments.some((segment) => segment.source === 'simulated') &&
                    <p className="mt-1 text-muted-foreground">Incluye conexiones simuladas para fines académicos.</p>}
                  {route.segments.length > 0 && <div className="mt-3 space-y-2">
                    <Button type="button" variant="outline" className="min-h-11 w-full" onClick={toggleAnimation}>
                      {animationStatus === 'playing' ? <Square aria-hidden="true" />
                        : animationStatus === 'finished' ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
                      {animationStatus === 'playing' ? 'Detener animación'
                        : animationStatus === 'finished' ? 'Repetir recorrido' : 'Animar recorrido'}
                    </Button>
                    <p className="text-xs text-muted-foreground">Animación acelerada para ilustrar la ruta; no estima el tiempo de caminata.</p>
                  </div>}
                </div>}
              </div>
              <div className="border-t pt-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="location-search" className="text-sm font-medium">Explorar ubicaciones</label>
                    <Button type="button" variant="outline" size="sm" className="min-h-11" disabled={!history.canGoBack()} onClick={goBack}>
                      <ArrowLeft aria-hidden="true" /> Volver
                    </Button>
                  </div>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input id="location-search" value={query} onChange={(event) => {
                      setQuery(event.target.value)
                      setSelectedId(undefined)
                    }} placeholder="Ej. Biblioteca" autoComplete="off" className="h-11 pl-9" />
                  </div>
                </div>
                {selectedLocation && <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3 text-sm">
                  <p className="font-medium">{selectedLocation.name}</p>
                  <p className="mt-1 text-muted-foreground">{selectedLocation.category} · Lugar seleccionado en el mapa.</p>
                  {!connectedIds.has(selectedLocation.id) && <p className="mt-1 text-amber-800">Sin conexión peatonal disponible; puedes verlo y buscarlo, pero no calcular una ruta desde o hacia aquí.</p>}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => {
                      setOriginId(selectedLocation.id)
                      clearRoute()
                    }}>Usar como origen</Button>
                    <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => {
                      setDestinationId(selectedLocation.id)
                      clearRoute()
                    }}>Usar como destino</Button>
                  </div>
                </div>}
                <div className="mt-5 max-h-[460px] space-y-2 overflow-y-auto pr-1" aria-label="Lugares del campus">
                  {visiblePlaces.length ? visiblePlaces.map((place) => (
                    <button key={place.id} type="button" onClick={() => {
                      consultLocation(place.id, place.name)
                    }}
                      aria-pressed={selectedId === place.id}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${selectedId === place.id ? 'border-primary bg-accent text-accent-foreground' : 'bg-card'}`}>
                      <MapPinned className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0"><span className="block">{place.name}</span><span className="block text-xs text-muted-foreground">{place.category}{!connectedIds.has(place.id) ? ' · Sin ruta' : ''}</span></span>
                    </button>
                  )) : <p className="py-4 text-sm text-muted-foreground">No hay lugares con ese prefijo.</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="order-2 min-w-0">
            <Card className="relative z-0 h-[430px] min-w-0 overflow-hidden p-0 sm:h-[540px] lg:h-[min(76vh,780px)]">
              <CampusLeafletMap network={network} selectedLocation={selectedLocation} focusToken={focusToken}
                route={route} animationStatus={animationStatus} playbackKey={playbackKey} onAnimationFinish={finishAnimation} />
            </Card>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Leyenda del mapa">
              <span><span className="mr-2 inline-block w-5 border-t-4 border-green-800 align-middle" />Sendero OSM</span>
              <span><span className="mr-2 inline-block w-5 border-t-4 border-violet-600 align-middle" />Escaleras OSM</span>
              <span><span className="mr-2 inline-block w-5 border-t-4 border-dashed border-amber-700 align-middle" />Conexión simulada</span>
              <span><span className="mr-2 inline-block size-3 rounded-full bg-slate-500 align-middle" />Lugar sin ruta disponible</span>
              <span><span className="mr-2 inline-block w-5 border-t-[5px] border-blue-600 align-middle" />Ruta calculada (discontinua si es simulada)</span>
              {route && (route.result.path.length === 1
                ? <span><span className="mr-2 inline-block size-3 rounded-full bg-violet-600 align-middle" />A/B · Origen y destino</span>
                : <>
                  <span><span className="mr-2 inline-block size-3 rounded-full bg-blue-600 align-middle" />A · Origen</span>
                  <span><span className="mr-2 inline-block size-3 rounded-full bg-red-600 align-middle" />B · Destino</span>
                </>)}
            </div>
            {network.paths.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Aún no hay caminos públicos para estas ubicaciones.</p>}
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Las líneas discontinuas son conexiones rectas aproximadas para fines académicos; no son senderos verificados.
              Las distancias son aproximadas. Verifica accesos y condiciones reales antes de desplazarte.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef } from 'react'
import { divIcon, type CircleMarker as LeafletCircleMarker } from 'leaflet'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import campusData from '@/features/map/data/uao-network.json'
import type { MapLocation, MapNetwork } from '@/features/map/lib/navigation-geometry'
import type { PlannedRoute } from '@/features/map/lib/route-planner'
import { animationDurationMs, buildAnimationTrack, positionAtProgress } from '@/features/map/lib/route-animation'

const categoryIcons: Record<string, string> = {
  'Aulas': '📚',
  'Auditorios': '🎭',
  'Edificio Central': '🏛️',
  'Espacios Deportivos y Culturales': '⚽',
  'Parqueaderos': '🅿️',
  'Porterías': '🚪',
  'Plantas de Tratamiento': '💧',
  'Servicios': '🛍️',
  'Uaolabs': '🧪',
  'Bienestar Universitario': '🩺',
  'Otros': '📍',
}

const markerAccent = '#b4535b'
const routeAccent = '#15803d'
const originAccent = '#2563eb'
const destinationAccent = '#dc2626'
const animationAccent = '#b45309'

function iconForLocation(category: string | null, name: string) {
  const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (normalizedName.includes('cafeter')) return '☕'
  if (normalizedName.includes('enfermer')) return '🩺'
  if (normalizedName.includes('agora')) return '🎪'
  if (normalizedName.includes('auditorio')) return '🎭'
  if (normalizedName.includes('cancha')) return '⚽'
  return categoryIcons[category ?? ''] ?? '📍'
}

function locationIcon(category: string | null, name: string, color: string, label: string | null, selected: boolean) {
  const content = label ?? iconForLocation(category, name)
  const fontSize = label ? '12px' : '16px'
  return divIcon({
    className: 'campus-location-icon',
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border:2px solid #fff;border-radius:9999px;background:${color};box-shadow:0 2px 6px rgb(0 0 0 / .35);font-size:${fontSize};line-height:1;${selected ? 'outline:3px solid rgb(180 83 91 / .35);' : ''}" aria-hidden="true">${content}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  })
}

function FocusOnLocation({ location, focusToken }: { location: MapLocation | undefined; focusToken: number }) {
  const map = useMap()

  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 19, { duration: 0.6 })
  }, [location, focusToken, map])

  return null
}

function FocusOnRoute({ route, network }: { route: PlannedRoute | null; network: MapNetwork }) {
  const map = useMap()

  useEffect(() => {
    if (!route?.result.reachable) return
    if (route.result.path.length === 1) {
      const location = network.locations.find((place) => place.id === route.result.path[0])
      if (location) map.flyTo([location.lat, location.lng], 19, { duration: 0.6 })
      return
    }
    const points = route.segments.flatMap((segment) => segment.coordinates)
    if (points.length) map.fitBounds(points, { padding: [32, 32], maxZoom: 19 })
  }, [map, network, route])

  return null
}

function AnimatedRouteMarker({ route, playbackKey, onFinish }: {
  route: PlannedRoute
  playbackKey: number
  onFinish: () => void
}) {
  const track = useMemo(() => buildAnimationTrack(route.segments), [route])
  const marker = useRef<LeafletCircleMarker | null>(null)
  const start = positionAtProgress(track, 0)

  useEffect(() => {
    if (!marker.current || !start) return
    marker.current.setLatLng(start)
    if (track.totalMeters === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      marker.current.setLatLng(positionAtProgress(track, 1)!)
      onFinish()
      return
    }

    let frame = 0
    let startedAt: number | undefined
    const duration = animationDurationMs(track.totalMeters)
    const animate = (now: number) => {
      startedAt ??= now
      const progress = Math.min(1, (now - startedAt) / duration)
      const position = positionAtProgress(track, progress)
      if (position) marker.current?.setLatLng(position)
      if (progress < 1) frame = requestAnimationFrame(animate)
      else onFinish()
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [track, playbackKey, onFinish, start])

  if (!start) return null
  return <CircleMarker ref={marker} center={start} radius={9}
    pathOptions={{ color: '#ffffff', weight: 3, fillColor: animationAccent, fillOpacity: 1 }}>
    <Tooltip direction="top">Recorrido animado (demostración)</Tooltip>
  </CircleMarker>
}

export function CampusLeafletMap({ network, selectedLocation, focusToken, route, animationStatus, playbackKey, onAnimationFinish }: {
  network: MapNetwork
  selectedLocation?: MapLocation
  focusToken: number
  route: PlannedRoute | null
  animationStatus: 'idle' | 'playing' | 'finished'
  playbackKey: number
  onAnimationFinish: () => void
}) {
  const places = network.locations.filter((location) => location.kind === 'poi')
  const connectedIds = new Set(network.paths.flatMap((path) => [path.from_location_id, path.to_location_id]))
  const routeStart = route?.result.path[0]
  const routeEnd = route?.result.path.at(-1)

  return (
    <MapContainer
      bounds={[[campusData.bounds.south, campusData.bounds.west], [campusData.bounds.north, campusData.bounds.east]]}
      boundsOptions={{ padding: [16, 16] }}
      minZoom={15}
      maxZoom={19}
      scrollWheelZoom
      dragging
      doubleClickZoom
      touchZoom
      zoomControl
      wheelDebounceTime={40}
      wheelPxPerZoomLevel={80}
      className="h-full w-full"
      aria-label="Mapa del campus UAO"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        maxNativeZoom={19}
      />
      {network.paths.map((path) => (
        <Polyline
          key={path.id}
          positions={path.coordinates.map(([lat, lng]) => [lat, lng] as [number, number])}
          pathOptions={path.source === 'simulated'
            ? { color: '#991b1b', weight: 4, dashArray: '7 8', opacity: 0.95 }
            : path.highway === 'steps'
              ? { color: '#000000', weight: 4, opacity: 0.9 }
              : { color: '#404040', weight: 4, opacity: 0.8 }}
        >
          <Tooltip sticky>
            {path.source === 'simulated'
              ? 'Conexión aproximada para demostración académica'
              : path.highway === 'steps' ? 'Escaleras registradas en OSM' : 'Sendero registrado en OSM'}
            {' · '}{Math.round(path.weight)} m
          </Tooltip>
        </Polyline>
      ))}
      {route?.segments.map((segment) => (
        <Polyline key={`${segment.from}-${segment.to}-${segment.pathId}`}
          positions={segment.coordinates}
          pathOptions={{ color: routeAccent, weight: 7, opacity: 0.95,
            ...(segment.source === 'simulated' ? { dashArray: '8 9' } : {}) }}>
          <Tooltip sticky>{segment.source === 'simulated'
            ? 'Ruta activa · conexión simulada' : 'Ruta activa · sendero OSM'}</Tooltip>
        </Polyline>
      ))}
      {places.map((place) => {
        const isStart = routeStart === place.id
        const isEnd = routeEnd === place.id
        const markerLabel = isStart && isEnd ? 'A/B' : isStart ? 'A' : isEnd ? 'B' : null
        const fillColor = isStart && isEnd ? routeAccent : isStart ? originAccent : isEnd ? destinationAccent
          : connectedIds.has(place.id) ? markerAccent : '#737373'
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={locationIcon(place.category, place.name, fillColor, markerLabel, selectedLocation?.id === place.id)}
          >
            <Popup>
              <span className="font-medium">{place.name}</span>
              <br />
              <span>{place.category}</span>
              <br />
              <span>{markerLabel ? `${markerLabel} · ${isStart && isEnd ? 'Origen y destino' : isStart ? 'Origen' : 'Destino'}`
                : connectedIds.has(place.id) ? 'Ubicación del mapa uMap UAO.' : 'Sin ruta peatonal disponible en este mapa.'}</span>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]} permanent={markerLabel !== null}>
              {markerLabel ? `${markerLabel} · ${place.name}` : place.name}
            </Tooltip>
          </Marker>
        )
      })}
      {route && animationStatus !== 'idle' && route.segments.length > 0 &&
        <AnimatedRouteMarker route={route} playbackKey={playbackKey} onFinish={onAnimationFinish} />}
      <FocusOnLocation location={selectedLocation} focusToken={focusToken} />
      <FocusOnRoute route={route} network={network} />
    </MapContainer>
  )
}

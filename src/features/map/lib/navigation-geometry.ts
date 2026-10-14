import type { CampusLocation, CampusPath } from '@/types/campus'
import campusData from '@/features/map/data/uao-network.json'

export type MapLocation = CampusLocation & {
  kind: 'poi' | 'node'
  category: string | null
  lat: number
  lng: number
}

export type MapPath = CampusPath & {
  source: 'osm' | 'simulated'
  sourceRef: string
  highway: string | null
  layer: string | null
  coordinates: [number, number][]
}

export interface MapNetwork {
  locations: MapLocation[]
  paths: MapPath[]
}

const localLocations = new Map(campusData.locations.map((location) => [location.id, location]))
const localPaths = new Map(campusData.paths.map((path) => [path.id, path]))

/** PostgreSQL decides which rows exist; the versioned GeoJSON supplies their Leaflet geometry. */
export function attachNavigationGeometry(
  locations: CampusLocation[],
  paths: CampusPath[],
): MapNetwork {
  const mappedLocations = locations.map((location): MapLocation => {
    const geometry = localLocations.get(location.id)
    if (!geometry || geometry.slug !== location.slug || !['poi', 'node'].includes(geometry.kind)) {
      throw new Error(`Falta geometría para la ubicación ${location.slug}. Sincroniza la semilla y el mapa.`)
    }
    return {
      ...location,
      kind: geometry.kind as 'poi' | 'node',
      category: 'category' in geometry ? geometry.category ?? null : null,
      lat: geometry.lat,
      lng: geometry.lng,
    }
  })

  const mappedPaths = paths.map((path): MapPath => {
    const geometry = localPaths.get(path.id)
    if (!geometry || geometry.from !== path.from_location_id || geometry.to !== path.to_location_id) {
      throw new Error(`Falta geometría para el camino ${path.id}. Sincroniza la semilla y el mapa.`)
    }
    if (geometry.source !== 'osm' && geometry.source !== 'simulated') {
      throw new Error(`Procedencia desconocida para el camino ${path.id}.`)
    }
    return {
      ...path,
      source: geometry.source,
      sourceRef: geometry.sourceRef,
      highway: geometry.highway,
      layer: geometry.layer,
      coordinates: geometry.coordinates.map(([lat, lng]) => [lat, lng]),
    }
  })

  return { locations: mappedLocations, paths: mappedPaths }
}

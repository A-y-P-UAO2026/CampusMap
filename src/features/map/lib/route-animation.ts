import type { RouteSegment } from './route-planner'

export interface AnimationPoint {
  coordinates: [number, number]
  distance: number
}

export interface AnimationTrack {
  points: AnimationPoint[]
  totalMeters: number
}

const sameCoordinates = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1]

const haversineMeters = (a: [number, number], b: [number, number]): number => {
  const radians = Math.PI / 180
  const deltaLat = (b[0] - a[0]) * radians
  const deltaLng = (b[1] - a[1]) * radians
  const sinLat = Math.sin(deltaLat / 2)
  const sinLng = Math.sin(deltaLng / 2)
  const arc = sinLat * sinLat
    + Math.cos(a[0] * radians) * Math.cos(b[0] * radians) * sinLng * sinLng
  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

/** Follows the route's versioned geometry; consecutive segment endpoints are joined once. */
export function buildAnimationTrack(segments: readonly RouteSegment[]): AnimationTrack {
  const points: AnimationPoint[] = []
  let distance = 0

  for (const [index, segment] of segments.entries()) {
    if (segment.coordinates.length < 2) throw new Error(`El tramo ${segment.pathId} no tiene geometría suficiente.`)
    const start = segment.coordinates[0]
    if (index > 0 && !sameCoordinates(points.at(-1)!.coordinates, start)) {
      throw new Error(`El tramo ${segment.pathId} no continúa la ruta anterior.`)
    }
    for (const coordinates of segment.coordinates) {
      const previous = points.at(-1)
      if (previous && sameCoordinates(previous.coordinates, coordinates)) continue
      if (previous) distance += haversineMeters(previous.coordinates, coordinates)
      points.push({ coordinates: [coordinates[0], coordinates[1]], distance })
    }
  }
  return { points, totalMeters: distance }
}

/** Interpolates a position along the route by geographic length, not by vertex count. */
export function positionAtProgress(track: AnimationTrack, progress: number): [number, number] | null {
  if (track.points.length === 0) return null
  const first = track.points[0]
  const last = track.points.at(-1)!
  if (!Number.isFinite(progress) || progress <= 0) return first.coordinates
  if (progress >= 1 || track.totalMeters === 0) return last.coordinates

  const target = progress * track.totalMeters
  for (let index = 1; index < track.points.length; index += 1) {
    const end = track.points[index]
    if (target > end.distance) continue
    const start = track.points[index - 1]
    const ratio = (target - start.distance) / (end.distance - start.distance)
    return [
      start.coordinates[0] + (end.coordinates[0] - start.coordinates[0]) * ratio,
      start.coordinates[1] + (end.coordinates[1] - start.coordinates[1]) * ratio,
    ]
  }
  return last.coordinates
}

/** Accelerated demonstration time, not a walking-time estimate. */
export function animationDurationMs(totalMeters: number): number {
  return Math.min(18000, Math.max(4000, totalMeters * 30))
}

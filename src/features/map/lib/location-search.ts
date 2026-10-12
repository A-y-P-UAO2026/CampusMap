import { Trie, normalizeTrieText } from '../../../structures/Trie.ts'
import type { MapLocation } from './navigation-geometry'

export const MAX_LOCATION_SUGGESTIONS = 6

/** Keeps original Supabase IDs/names; the Trie stores only normalized search keys. */
export class LocationSearchIndex {
  private readonly trie = new Trie()
  private readonly placesByKey = new Map<string, Map<string, MapLocation>>()

  constructor(locations: readonly MapLocation[]) {
    for (const location of locations) {
      if (!location.is_public || location.kind !== 'poi') continue
      const key = normalizeTrieText(location.name)
      if (!key) continue
      this.trie.insert(key)
      let places = this.placesByKey.get(key)
      if (!places) {
        places = new Map()
        this.placesByKey.set(key, places)
      }
      places.set(location.id, location)
    }
  }

  suggest(prefix: string, limit = MAX_LOCATION_SUGGESTIONS): MapLocation[] {
    if (!normalizeTrieText(prefix) || !Number.isFinite(limit) || limit <= 0) return []
    const maximum = Math.min(Math.floor(limit), MAX_LOCATION_SUGGESTIONS)
    const results: MapLocation[] = []
    for (const key of this.trie.suggestions(prefix, maximum)) {
      for (const place of this.placesByKey.get(key)?.values() ?? []) {
        results.push(place)
        if (results.length >= maximum) return results
      }
    }
    return results
  }
}

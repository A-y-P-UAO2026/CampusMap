import type { CampusLocation, CampusPath } from '@/types/campus'
import { supabase } from '@/lib/supabase'

export async function fetchPublicLocations(): Promise<CampusLocation[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_public', true)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function fetchPublicPaths(): Promise<CampusPath[]> {
  const { data, error } = await supabase
    .from('paths')
    .select('*')
    .eq('is_public', true)

  if (error) throw error
  return data ?? []
}

/** Red pública UAO; excluye las ubicaciones y caminos [PRUEBA] de la semilla inicial. */
export async function fetchUaoNavigationNetwork(): Promise<{
  locations: CampusLocation[]
  paths: CampusPath[]
}> {
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .eq('is_public', true)
    .like('slug', 'uao-%')
    .order('name')

  if (locationsError) throw locationsError
  if (!locations?.length) return { locations: [], paths: [] }

  const locationIds = locations.map((location) => location.id)
  const locationIdSet = new Set(locationIds)
  const { data: paths, error: pathsError } = await supabase
    .from('paths')
    .select('*')
    .eq('is_public', true)
    .in('from_location_id', locationIds)

  if (pathsError) throw pathsError
  return {
    locations,
    paths: (paths ?? []).filter((path) => locationIdSet.has(path.to_location_id)),
  }
}

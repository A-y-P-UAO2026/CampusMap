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

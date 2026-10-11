import type { CampusEvent } from '@/types/campus'
import { supabase } from '@/lib/supabase'

export async function fetchUpcomingEvents(): Promise<CampusEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'active'])
    .gt('starts_at', new Date().toISOString())
    .eq('registration_open', true)
    .order('starts_at')

  if (error) throw error
  return data ?? []
}

export async function fetchEventById(eventId: string): Promise<CampusEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle()

  if (error) throw error
  return data
}

import type { CampusEvent, CampusLocation } from '@/types/campus'
import { supabase } from '@/lib/supabase'

export type EventLocation = Pick<CampusLocation, 'id' | 'name' | 'slug'>
export type EventWithLocation = CampusEvent & { location: EventLocation | null }

const EVENT_SELECT = '*, location:locations(id, name, slug)' as const

export async function fetchUpcomingEvents(): Promise<EventWithLocation[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .in('status', ['published', 'active'])
    .gt('starts_at', new Date().toISOString())
    .order('starts_at')

  if (error) throw error
  return data ?? []
}

export async function fetchEventById(eventId: string): Promise<EventWithLocation | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', eventId)
    .maybeSingle()

  if (error) throw error
  return data
}
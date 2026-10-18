import type { CampusEvent } from '@/types/campus'

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
})

export function formatEventDate(iso: string): string {
  const text = dateFormatter.format(new Date(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatEventTimeRange(startIso: string, endIso: string): string {
  return `${timeFormatter.format(new Date(startIso))} – ${timeFormatter.format(new Date(endIso))}`
}

export interface RegistrationState {
  open: boolean
  label: string
}

export function getRegistrationState(
  event: Pick<CampusEvent, 'status' | 'registration_open' | 'starts_at'>,
  now: Date = new Date(),
): RegistrationState {
  if (event.status === 'cancelled') return { open: false, label: 'Evento cancelado' }
  if (event.status === 'finished') return { open: false, label: 'Evento finalizado' }
  if (new Date(event.starts_at) <= now) return { open: false, label: 'Evento ya comenzado' }
  if (!event.registration_open) return { open: false, label: 'Inscripciones cerradas' }
  return { open: true, label: 'Inscripciones abiertas' }
}

export function canCancelRegistration(
  event: Pick<CampusEvent, 'status' | 'starts_at'>,
  now: Date = new Date(),
): boolean {
  return (event.status === 'published' || event.status === 'active') && new Date(event.starts_at) > now
}
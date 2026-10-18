import { supabase } from '@/lib/supabase'
import { RegistrationError, toRegistrationError } from './registrationErrors'

export { RegistrationError } from './registrationErrors'
export type { RegistrationErrorCode } from './registrationErrors'

export type RegisterResult =
  | { status: 'confirmed'; registrationId: string }
  | { status: 'waitlisted' }

export interface EventAvailability {
  capacity: number
  confirmed: number
  available: number
}

export type MyEventStatus =
  | { state: 'none' }
  | { state: 'confirmed' }
  | { state: 'waitlisted'; position: number }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unexpectedResponse(): RegistrationError {
  return new RegistrationError('unknown', 'Recibimos una respuesta inesperada del servidor.')
}

/** Pide un cupo. PostgreSQL decide si queda confirmado o en lista de espera. */
export async function registerForEvent(eventId: string): Promise<RegisterResult> {
  const { data, error } = await supabase.rpc('register_for_event', { p_event_id: eventId })
  if (error) throw toRegistrationError(error)

  if (isRecord(data)) {
    if (data.status === 'confirmed' && typeof data.registration_id === 'string') {
      return { status: 'confirmed', registrationId: data.registration_id }
    }
    if (data.status === 'waitlisted') return { status: 'waitlisted' }
  }
  throw unexpectedResponse()
}

/**
 * Cancela la inscripción confirmada. La RPC también promueve al siguiente de
 * la lista de espera; el identificador de esa persona se ignora a propósito
 * para no exponer datos de terceros.
 */
export async function cancelEventRegistration(eventId: string): Promise<{ status: 'cancelled' }> {
  const { data, error } = await supabase.rpc('cancel_event_registration', { p_event_id: eventId })
  if (error) throw toRegistrationError(error)

  if (isRecord(data) && data.status === 'cancelled') return { status: 'cancelled' }
  throw unexpectedResponse()
}

/** Cupos del evento (datos agregados, visibles sin iniciar sesión). */
export async function fetchEventAvailability(eventId: string): Promise<EventAvailability> {
  const { data, error } = await supabase.rpc('get_event_availability', { p_event_id: eventId })
  if (error) throw toRegistrationError(error)

  if (
    isRecord(data) &&
    typeof data.capacity === 'number' &&
    typeof data.confirmed === 'number' &&
    typeof data.available === 'number'
  ) {
    return { capacity: data.capacity, confirmed: data.confirmed, available: data.available }
  }
  throw unexpectedResponse()
}

/** Estado propio en el evento: sin inscripción, confirmada o en espera (con posición). */
export async function fetchMyEventStatus(eventId: string): Promise<MyEventStatus> {
  const { data, error } = await supabase.rpc('get_my_event_status', { p_event_id: eventId })
  if (error) throw toRegistrationError(error)

  if (isRecord(data)) {
    if (data.state === 'none') return { state: 'none' }
    if (data.state === 'confirmed') return { state: 'confirmed' }
    if (data.state === 'waitlisted' && typeof data.position === 'number') {
      return { state: 'waitlisted', position: data.position }
    }
  }
  throw unexpectedResponse()
}
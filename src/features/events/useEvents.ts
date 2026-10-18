import { useCallback, useEffect, useState } from 'react'
import {
  fetchEventById,
  fetchUpcomingEvents,
  type EventWithLocation,
} from '@/services/events'
import { sortEventsByStart } from './sortEvents'

// ---------- Lista de próximos eventos ----------

type ListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; events: EventWithLocation[] }

export function useUpcomingEvents() {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchUpcomingEvents()
      .then((events) => {
        if (!cancelled) setState({ status: 'success', events: sortEventsByStart(events) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}

// ---------- Detalle de un evento ----------

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type DetailResult =
  | { id: string; status: 'success'; event: EventWithLocation }
  | { id: string; status: 'not_found' }
  | { id: string; status: 'error' }

export type DetailState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error' }
  | { status: 'success'; event: EventWithLocation }

export function useEventDetail(id: string | undefined) {
  const [result, setResult] = useState<DetailResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Un id que no es UUID no existe: se evita consultar a la base.
  const validId = id && UUID_PATTERN.test(id) ? id : null

  useEffect(() => {
    if (!validId) return
    let cancelled = false

    fetchEventById(validId)
      .then((event) => {
        if (cancelled) return
        setResult(
          event
            ? { id: validId, status: 'success', event }
            : { id: validId, status: 'not_found' },
        )
      })
      .catch(() => {
        if (!cancelled) setResult({ id: validId, status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [validId, attempt])

  const reload = useCallback(() => {
    setResult(null)
    setAttempt((n) => n + 1)
  }, [])

  let state: DetailState
  if (!validId) state = { status: 'not_found' }
  else if (!result || result.id !== validId) state = { status: 'loading' }
  else state = result

  return { state, reload }
}
import { useCallback, useEffect, useState } from 'react'
import {
  cancelEventRegistration,
  fetchEventAvailability,
  fetchMyEventStatus,
  registerForEvent,
  RegistrationError,
  type EventAvailability,
  type MyEventStatus,
} from '@/services/registrations'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

type Loaded<T> =
  | { key: string; status: 'success'; data: T }
  | { key: string; status: 'error'; message: string }

export interface Feedback {
  type: 'success' | 'error'
  message: string
}

function describeError(error: unknown): string {
  return error instanceof RegistrationError
    ? error.message
    : 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

// Un resultado solo vale para el evento y el usuario con que se pidió.
function resolve<T>(loaded: Loaded<T> | null, key: string): LoadState<T> {
  if (!loaded || loaded.key !== key) return { status: 'loading' }
  return loaded.status === 'success'
    ? { status: 'success', data: loaded.data }
    : { status: 'error', message: loaded.message }
}

/**
 * Todo lo que muestra el panel de inscripción sale de las RPC de PostgreSQL:
 * los cupos y la posición en espera se leen del servidor y se vuelven a
 * consultar después de cada acción. React no calcula nada por su cuenta.
 */
export function useEventRegistration(eventId: string, userId: string | null) {
  const key = `${eventId}:${userId ?? 'anon'}`

  const [availability, setAvailability] = useState<Loaded<EventAvailability> | null>(null)
  const [mine, setMine] = useState<Loaded<MyEventStatus> | null>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState<'register' | 'cancel' | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchEventAvailability(eventId)
      .then((data) => {
        if (!cancelled) setAvailability({ key, status: 'success', data })
      })
      .catch((error: unknown) => {
        if (!cancelled) setAvailability({ key, status: 'error', message: describeError(error) })
      })

    if (userId) {
      fetchMyEventStatus(eventId)
        .then((data) => {
          if (!cancelled) setMine({ key, status: 'success', data })
        })
        .catch((error: unknown) => {
          if (!cancelled) setMine({ key, status: 'error', message: describeError(error) })
        })
    }

    return () => {
      cancelled = true
    }
  }, [eventId, userId, key, version])

  // Vuelve a consultar al servidor sin tocar el aviso (lo usan register y cancel).
  const reload = useCallback(() => setVersion((n) => n + 1), [])

  // Recarga manual («Actualizar estado»): también borra el aviso anterior, que
  // pudo quedar desactualizado (por ejemplo, «quedaste en la lista de espera»
  // cuando ya fuiste promovido).
  const refresh = useCallback(() => {
    setFeedback(null)
    reload()
  }, [reload])

  const register = useCallback(async () => {
    setBusy('register')
    setFeedback(null)
    try {
      const result = await registerForEvent(eventId)
      setFeedback({
        type: 'success',
        message:
          result.status === 'confirmed'
            ? 'Inscripción confirmada.'
            : 'No quedaban cupos: quedaste en la lista de espera.',
      })
    } catch (error) {
      setFeedback({ type: 'error', message: describeError(error) })
    } finally {
      setBusy(null)
      reload() // el estado real lo decide el servidor
    }
  }, [eventId, reload])

  const cancel = useCallback(async () => {
    setBusy('cancel')
    setFeedback(null)
    try {
      await cancelEventRegistration(eventId)
      setFeedback({ type: 'success', message: 'Tu inscripción fue cancelada.' })
    } catch (error) {
      setFeedback({ type: 'error', message: describeError(error) })
    } finally {
      setBusy(null)
      reload()
    }
  }, [eventId, reload])

  return {
    availability: resolve(availability, key),
    mine: userId ? resolve(mine, key) : null,
    busy,
    feedback,
    register,
    cancel,
    refresh,
  }
}
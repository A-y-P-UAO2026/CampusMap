import { useState } from 'react'
import { Check, Clock, LogIn, RefreshCw, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { withRedirect } from '@/features/auth/Redirect'
import { useSession } from '@/features/auth/Usesession'
import type { EventAvailability } from '@/services/registrations'
import type { EventWithLocation } from '@/services/events'
import { canCancelRegistration, getRegistrationState } from './eventFormat'
import { useEventRegistration, type LoadState } from './Useeventregistration'

function describeAvailability(state: LoadState<EventAvailability>): string {
  if (state.status === 'loading') return 'Consultando cupos…'
  if (state.status === 'error') return state.message
  const { available, confirmed, capacity } = state.data
  return available > 0
    ? `Cupos disponibles: ${available} de ${capacity}.`
    : `Sin cupos disponibles (${confirmed} de ${capacity} ocupados). Si te inscribes, entrarás a la lista de espera.`
}

export function EventRegistrationPanel({ event }: { event: EventWithLocation }) {
  const { user, loading: sessionLoading } = useSession()
  const { availability, mine, busy, feedback, register, cancel, refresh } = useEventRegistration(
    event.id,
    user?.id ?? null,
  )
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const registration = getRegistrationState(event)
  const detailPath = `/eventos/${event.id}`

  // El aviso de cupos solo es útil para quien aún no está inscrito: se oculta
  // si ya está confirmado o en espera, y mientras se consulta su estado.
  const alreadyIn = mine?.status === 'success' && mine.data.state !== 'none'
  const showAvailability = !alreadyIn && (!user || mine?.status !== 'loading')

  return (
    <section aria-labelledby="inscripcion-titulo" className="mt-8 border-t pt-6">
      <h2 id="inscripcion-titulo" className="text-lg font-semibold">
        Inscripción
      </h2>
      {showAvailability && (
        <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
          {describeAvailability(availability)}
        </p>
      )}

      {/* ---------- Visitante sin sesión ---------- */}
      {!sessionLoading && !user && (
        <div className="mt-4 space-y-3">
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={!registration.open}
            onClick={() => setShowAuthPrompt(true)}
          >
            <UserPlus className="size-4" /> Inscribirme
          </Button>
          {!registration.open && (
            <p className="text-sm text-muted-foreground">{registration.label}.</p>
          )}
          {showAuthPrompt && registration.open && (
            <div className="rounded-lg border bg-muted/40 p-4" role="status">
              <p className="text-sm">
                Para inscribirte necesitas una cuenta. Después de entrar volverás a este evento.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button render={<Link to={withRedirect('/login', detailPath)} />} className="min-h-11">
                  <LogIn className="size-4" /> Iniciar sesión
                </Button>
                <Button
                  render={<Link to={withRedirect('/registro', detailPath)} />}
                  variant="outline"
                  className="min-h-11"
                >
                  Registrarme
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- Estudiante con sesión ---------- */}
      {user && mine?.status === 'loading' && (
        <p className="mt-4 text-sm text-muted-foreground">Consultando tu estado…</p>
      )}

      {user && mine?.status === 'error' && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-destructive" role="alert">
            {mine.message}
          </p>
          <Button variant="outline" className="min-h-11" onClick={refresh}>
            <RefreshCw className="size-4" /> Reintentar
          </Button>
        </div>
      )}

      {user && mine?.status === 'success' && mine.data.state === 'none' && (
        <div className="mt-4 space-y-3">
          <Button
            className="min-h-11 w-full sm:w-auto"
            disabled={!registration.open || busy !== null}
            onClick={register}
          >
            <UserPlus className="size-4" />
            {busy === 'register' ? 'Inscribiendo…' : 'Inscribirme'}
          </Button>
          {!registration.open && (
            <p className="text-sm text-muted-foreground">{registration.label}.</p>
          )}
        </div>
      )}

      {user && mine?.status === 'success' && mine.data.state === 'confirmed' && (
        <div className="mt-4 space-y-3">
          <Badge variant="secondary" className="gap-1">
            <Check className="size-3.5" aria-hidden="true" /> Inscripción confirmada
          </Badge>
          {canCancelRegistration(event) ? (
            confirmingCancel ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm">
                  ¿Seguro que quieres cancelar? Tu cupo pasará a la siguiente persona en espera.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="destructive"
                    className="min-h-11"
                    disabled={busy !== null}
                    onClick={async () => {
                      await cancel()
                      setConfirmingCancel(false)
                    }}
                  >
                    {busy === 'cancel' ? 'Cancelando…' : 'Sí, cancelar inscripción'}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={busy !== null}
                    onClick={() => setConfirmingCancel(false)}
                  >
                    No, mantenerla
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button variant="outline" className="min-h-11" onClick={() => setConfirmingCancel(true)}>
                  Cancelar inscripción
                </Button>
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              El evento ya comenzó o terminó, por eso no se puede cancelar.
            </p>
          )}
        </div>
      )}

      {user && mine?.status === 'success' && mine.data.state === 'waitlisted' && (
        <div className="mt-4 space-y-3">
          <Badge variant="outline" className="gap-1">
            <Clock className="size-3.5" aria-hidden="true" /> En lista de espera
          </Badge>
          <p className="text-sm">
            Tu posición: <strong>{mine.data.position}</strong>. Si se libera un cupo, pasarás a
            confirmada en orden de llegada.
          </p>
          <Button variant="outline" className="min-h-11" onClick={refresh}>
            <RefreshCw className="size-4" /> Actualizar estado
          </Button>
        </div>
      )}

      {feedback && (
        <p
          className={
            feedback.type === 'success'
              ? 'mt-4 rounded-lg bg-muted p-3 text-sm'
              : 'mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive'
          }
          role={feedback.type === 'success' ? 'status' : 'alert'}
        >
          {feedback.message}
        </p>
      )}
    </section>
  )
}
// Archivo puro (sin Supabase) para poder probarlo sin variables de entorno.

export type RegistrationErrorCode =
  | 'auth_required'
  | 'event_not_found'
  | 'registration_closed'
  | 'already_registered'
  | 'already_waitlisted'
  | 'not_registered'
  | 'cancel_not_allowed'
  | 'unknown'

export class RegistrationError extends Error {
  readonly code: RegistrationErrorCode

  constructor(code: RegistrationErrorCode, message: string) {
    super(message)
    this.name = 'RegistrationError'
    this.code = code
  }
}

interface RpcErrorLike {
  code?: string
  message?: string
}

/**
 * Las RPC lanzan excepciones de PostgreSQL con un código SQLSTATE:
 *   28000 sin sesión · P0002 no encontrado · 22023 regla de negocio
 *   23505 duplicado
 * El texto en inglés distingue los casos que comparten código.
 */
export function toRegistrationError(error: RpcErrorLike): RegistrationError {
  const message = error.message ?? ''

  switch (error.code) {
    case '28000':
      return new RegistrationError('auth_required', 'Inicia sesión para continuar.')

    case 'P0002':
      if (message.includes('Active registration')) {
        return new RegistrationError('not_registered', 'No tienes una inscripción activa en este evento.')
      }
      return new RegistrationError('event_not_found', 'No encontramos este evento.')

    case '22023':
      if (message.includes('cancelled after')) {
        return new RegistrationError('cancel_not_allowed', 'El evento ya comenzó, por eso no se puede cancelar.')
      }
      return new RegistrationError('registration_closed', 'Las inscripciones para este evento están cerradas.')

    case '23505':
      if (message.includes('waitlist')) {
        return new RegistrationError('already_waitlisted', 'Ya estás en la lista de espera de este evento.')
      }
      return new RegistrationError('already_registered', 'Ya estás inscrito en este evento.')

    default:
      return new RegistrationError('unknown', 'Ocurrió un error inesperado. Inténtalo de nuevo.')
  }
}
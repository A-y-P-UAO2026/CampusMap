import { describe, expect, it } from 'vitest';
import {
  RegistrationError,
  toRegistrationError,
} from '../src/services/registrationErrors';

describe('toRegistrationError', () => {
  it('sin sesión (28000)', () => {
    const e = toRegistrationError({ code: '28000', message: 'Authentication required' });
    expect(e).toBeInstanceOf(RegistrationError);
    expect(e.code).toBe('auth_required');
  });

  it('evento inexistente (P0002)', () => {
    expect(toRegistrationError({ code: 'P0002', message: 'Event not found' }).code).toBe(
      'event_not_found',
    );
  });

  it('sin inscripción activa (P0002)', () => {
    expect(
      toRegistrationError({ code: 'P0002', message: 'Active registration not found' }).code,
    ).toBe('not_registered');
  });

  it('inscripciones cerradas (22023)', () => {
    expect(
      toRegistrationError({ code: '22023', message: 'Event registrations are closed' }).code,
    ).toBe('registration_closed');
  });

  it('cancelación no permitida después del inicio (22023)', () => {
    expect(
      toRegistrationError({
        code: '22023',
        message: 'Registrations cannot be cancelled after the event starts',
      }).code,
    ).toBe('cancel_not_allowed');
  });

  it('ya inscrito (23505)', () => {
    expect(
      toRegistrationError({ code: '23505', message: 'Student is already registered' }).code,
    ).toBe('already_registered');
  });

  it('ya en lista de espera (23505)', () => {
    expect(
      toRegistrationError({ code: '23505', message: 'Student is already on the waitlist' }).code,
    ).toBe('already_waitlisted');
  });

  it('error desconocido o sin código', () => {
    expect(toRegistrationError({}).code).toBe('unknown');
    expect(toRegistrationError({ code: 'XX000', message: 'boom' }).code).toBe('unknown');
  });

  it('el mensaje es legible para el usuario, no técnico', () => {
    const e = toRegistrationError({ code: '23505', message: 'Student is already registered' });
    expect(e.message).toBe('Ya estás inscrito en este evento.');
  });
});
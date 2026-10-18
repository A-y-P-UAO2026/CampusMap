import { describe, expect, it } from 'vitest';
import { getSafeRedirect, withRedirect } from '../src/features/auth/redirect';

describe('getSafeRedirect', () => {
  it('acepta rutas internas', () => {
    expect(getSafeRedirect('/eventos/abc-123')).toBe('/eventos/abc-123');
    expect(getSafeRedirect('/mapa?lugar=1')).toBe('/mapa?lugar=1');
  });

  it('usa la raíz si no hay destino', () => {
    expect(getSafeRedirect(null)).toBe('/');
    expect(getSafeRedirect(undefined)).toBe('/');
    expect(getSafeRedirect('')).toBe('/');
  });

  it('rechaza direcciones externas (open redirect)', () => {
    expect(getSafeRedirect('https://sitio-malicioso.com')).toBe('/');
    expect(getSafeRedirect('//sitio-malicioso.com')).toBe('/');
    expect(getSafeRedirect('/\\sitio-malicioso.com')).toBe('/');
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/');
  });

  it('rechaza rutas relativas sin barra inicial', () => {
    expect(getSafeRedirect('eventos')).toBe('/');
  });

  it('rechaza caracteres de control', () => {
    expect(getSafeRedirect('/eventos\n/x')).toBe('/');
  });

  it('evita ciclos con /login y /registro', () => {
    expect(getSafeRedirect('/login')).toBe('/');
    expect(getSafeRedirect('/registro?redirect=/eventos')).toBe('/');
    expect(getSafeRedirect('/login/')).toBe('/');
  });

  it('no bloquea rutas que solo empiezan parecido', () => {
    expect(getSafeRedirect('/loginfo')).toBe('/loginfo');
  });

  it('permite un destino alternativo', () => {
    expect(getSafeRedirect('https://x.com', '/eventos')).toBe('/eventos');
  });
});

describe('withRedirect', () => {
  it('agrega el destino codificado', () => {
    expect(withRedirect('/login', '/eventos/abc')).toBe('/login?redirect=%2Feventos%2Fabc');
  });

  it('no agrega nada si el destino es la raíz', () => {
    expect(withRedirect('/login', '/')).toBe('/login');
  });
});
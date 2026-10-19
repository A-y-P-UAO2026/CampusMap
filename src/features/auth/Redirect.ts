/**
 * Valida la ruta a la que se vuelve después de iniciar sesión.
 *
 * Solo se aceptan rutas internas ("/eventos/123"). Cualquier otra cosa
 * ("https://sitio-malicioso.com", "//sitio.com") se descarta para evitar
 * un "open redirect", donde alguien arma un enlace de login que te saca de
 * CampusMap después de autenticarte.
 */
export function getSafeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  if (value.includes('\\')) return fallback
  if ([...value].some((char) => char.charCodeAt(0) < 32)) return fallback

  if (/^\/(login|registro)(\/|\?|#|$)/.test(value)) return fallback

  return value
}

export function withRedirect(path: string, redirectTo: string): string {
  return redirectTo === '/' ? path : `${path}?redirect=${encodeURIComponent(redirectTo)}`
}
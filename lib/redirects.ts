const DEFAULT_REDIRECT = '/dashboard'

function hasControlCharacter(value: string) {
  return /[\u0000-\u001f\u007f]/.test(value)
}

export function safeRelativeRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
) {
  if (!value) return fallback

  const trimmed = value.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    hasControlCharacter(trimmed)
  ) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, 'https://auteur.local')
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export function safeRedirectUrl(
  requestUrl: string,
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
) {
  return new URL(safeRelativeRedirect(value, fallback), requestUrl)
}

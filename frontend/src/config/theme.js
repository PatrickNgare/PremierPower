/**
 * Theme resolution, in one place.
 *
 * Two states, and only two: light and dark. There is no "system" option in the
 * UI — but with nothing stored yet the switch has to start somewhere, and the
 * operating system's setting is a better opening position than a guess. Once
 * someone touches the control, their choice is written down and wins from then
 * on.
 */
export const THEME_KEY = 'pp-theme'

/** Page grounds, matching --color-page. Drives the browser's own chrome. */
export const THEME_COLOR = { light: '#FCFCFB', dark: '#0D0E11' }

/** localStorage throws in some privacy modes; a theme is never worth an error. */
export function storedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* A preference we cannot persist still applies for this page. */
  }
}

export function systemTheme() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** The stored choice if there is one, otherwise wherever the OS is pointing. */
export function resolveTheme() {
  return storedTheme() ?? systemTheme()
}

/**
 * Writes the theme to the document. The attribute drives every colour token;
 * the meta tag drives the browser's own chrome on mobile, which otherwise
 * stays white above a near-black page.
 */
export function applyTheme(theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[theme] ?? THEME_COLOR.light)
}

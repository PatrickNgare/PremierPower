import { useCallback, useSyncExternalStore } from 'react'
import { applyTheme, resolveTheme, storeTheme, storedTheme, systemTheme } from '@/config/theme'

/**
 * The theme, as one shared value.
 *
 * Deliberately an external store rather than useState. Four components read
 * the theme — the public toggle, the navbar (which swaps the lockup), the
 * mobile sheet and the admin shell — and per-component state gave each its own
 * private copy: clicking the toggle updated the toggle, and the navbar went on
 * rendering the black-on-black logo because nothing told it to re-render.
 *
 * The document already carries the right theme before any of this runs — the
 * inline script in index.html sets it, so the page never paints light and then
 * repaints dark. This keeps the controls in sync and writes the choice down.
 */
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

function subscribe(listener) {
  listeners.add(listener)

  // Only until the visitor first uses the control. After that their choice is
  // stored and the operating system stops having a say.
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  const onSystemChange = () => {
    if (storedTheme()) return
    applyTheme(systemTheme())
    emit()
  }
  mq?.addEventListener('change', onSystemChange)

  return () => {
    listeners.delete(listener)
    mq?.removeEventListener('change', onSystemChange)
  }
}

// Read from the document, which the inline script already set. Keeping the DOM
// as the source of truth means the store cannot disagree with what is painted.
const getSnapshot = () => document.documentElement.getAttribute('data-theme') ?? 'light'

// No document during SSR or the pre-hydration pass; light is the default
// ground, and the inline script corrects it before anything is visible.
const getServerSnapshot = () => 'light'

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setTheme = useCallback((next) => {
    storeTheme(next)
    applyTheme(next)
    emit()
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolveTheme() === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  return { theme, isDark: theme === 'dark', setTheme, toggle }
}

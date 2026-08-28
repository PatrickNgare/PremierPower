import { useApi } from '@/hooks/useApi'
import { navLinks } from '@/components/layout/navLinks'

/**
 * Navigation, from the CMS.
 *
 * The bundled list stays as the fallback so the header still renders during
 * the first paint and if the API is unreachable — a site whose navigation
 * disappears when a request is slow is worse than one that cannot be reordered.
 */
export function useMenu(menu = 'header', fallback = navLinks) {
  const { data } = useApi(`/menu/filter?menu=${menu}`, null)
  if (!Array.isArray(data) || data.length === 0) return fallback
  return data.map((m) => ({ to: m.href, label: m.label, newTab: m.new_tab }))
}

import { createContext, useContext, useMemo } from 'react'
import { site as bundled, withSettings } from '@/config/site'
import { useApi } from '@/hooks/useApi'

const SiteContext = createContext(bundled)

/**
 * Company details, from the CMS.
 *
 * Fetched once at the root rather than per component: the phone number appears
 * in the header, the footer, the floating call button and two page bodies, and
 * five requests for one row of data is silly.
 *
 * Until it arrives — and if it never does — every consumer sees the bundled
 * config, which is the same real content plus the `pending` markers that make
 * the site show an honest gap rather than invent a licence number.
 */
export function SiteProvider({ children }) {
  const { data } = useApi('/settings', null)
  const value = useMemo(() => withSettings(bundled, data), [data])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)

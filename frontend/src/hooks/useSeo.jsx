import { createContext, useContext, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'

const SeoContext = createContext([])

/**
 * Per-route search metadata, from the CMS.
 *
 * Fetched once at the root: it is one small table, and every page needs at
 * most one row of it. Until it arrives each page renders the tags it ships
 * with, so a slow request never leaves a page without a title.
 */
export function SeoProvider({ children }) {
  const { data } = useApi('/seo', null)
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data])
  return <SeoContext.Provider value={rows}>{children}</SeoContext.Provider>
}

/** The row for a path, or null. Trailing slashes are ignored so "/services/"
 *  and "/services" are the same page. */
export function useSeoFor(path) {
  const rows = useContext(SeoContext)
  const wanted = path === '/' ? '/' : path.replace(/\/+$/, '')
  return rows.find((r) => (r.path === '/' ? '/' : r.path.replace(/\/+$/, '')) === wanted) ?? null
}

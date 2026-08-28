import { useApi } from '@/hooks/useApi'

/**
 * A page's blocks, from the CMS.
 *
 * Returns a lookup by key rather than a list, because every page outside the
 * home page renders its blocks in a fixed arrangement — the CMS changes their
 * words, not where they sit. Only the home page is composed from the order.
 *
 * `fallback` is what the page shipped with, so a slow or unreachable API
 * leaves the page exactly as it was written.
 */
export function usePageSections(page, fallback = {}) {
  const { data } = useApi(`/page-sections/filter?page=${encodeURIComponent(page)}`, null)
  if (!Array.isArray(data) || data.length === 0) return fallback
  const byKey = {}
  for (const row of data) {
    if (row.enabled) byKey[row.key] = row
  }
  // A page whose every block is hidden is almost certainly a mistake rather
  // than an intention, so fall back rather than render nothing at all.
  return Object.keys(byKey).length ? byKey : fallback
}

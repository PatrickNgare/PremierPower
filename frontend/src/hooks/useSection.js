import { useApi } from '@/hooks/useApi'

/**
 * The repeated items inside a home page block — safety marks, lighting tiles,
 * stat figures.
 *
 * Falls back to whatever the component shipped with, so a block never renders
 * empty because a request was slow.
 */
export function useSectionItems(section, fallback = []) {
  const { data } = useApi(`/section-items/filter?section=${section}`, null)
  return Array.isArray(data) && data.length ? data : fallback
}

/**
 * A block's own heading. Titles containing "|" are two lines — the design
 * breaks several headings deliberately, and a CMS field cannot hold a JSX
 * fragment.
 */
export function splitTitle(title = '') {
  const [first, ...rest] = String(title).split('|')
  return [first.trim(), rest.join('|').trim()]
}

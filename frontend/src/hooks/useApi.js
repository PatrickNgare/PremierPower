import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? '/api'

/**
 * A preview token in the address travels with every content request.
 *
 * Read once at module load rather than per call: it comes from the URL the
 * page was opened with, and a client-side navigation inside the preview should
 * keep previewing rather than silently drop back to published content.
 */
const PREVIEW = (() => {
  try {
    return new URLSearchParams(window.location.search).get('preview') ?? ''
  } catch {
    return ''
  }
})()

/** Append the preview token, if this is a preview session. */
const withPreview = (path) => {
  if (!PREVIEW) return path
  return `${path}${path.includes('?') ? '&' : '?'}preview=${encodeURIComponent(PREVIEW)}`
}

export const isPreview = () => Boolean(PREVIEW)

/**
 * Reads CMS-managed content, falling back to the bundled data when the API is
 * unreachable or has nothing published yet. The fallback is never invented
 * content — it is the same honest, editable defaults shipped in src/data.
 */
export function useApi(path, fallback) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  // Held in a ref rather than listed as a dependency: callers pass array
  // literals, and depending on one would re-run the effect every render.
  const fallbackRef = useRef(fallback)
  useEffect(() => { fallbackRef.current = fallback })

  useEffect(() => {
    let alive = true
    fetch(`${API}${withPreview(path)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (!alive) return
        // An empty published set means "nothing to show yet", not "use fallback".
        if (Array.isArray(json)) setData(json.length ? json : fallbackRef.current)
        else setData({ ...fallbackRef.current, ...json })
      })
      .catch(() => { /* keep the fallback */ })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [path])

  return { data, loading }
}

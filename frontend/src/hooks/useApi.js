import { useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? '/api'

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
    fetch(`${API}${path}`)
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

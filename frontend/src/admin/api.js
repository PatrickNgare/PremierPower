/**
 * The CMS's one door to the API.
 *
 * Every call goes through `request`, so the token, the error shape and the
 * 401-means-signed-out rule are decided once. Screens never touch fetch.
 */

const BASE = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'pp-admin-token'

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* private mode, or storage disabled */ }
}

/** Raised for any non-2xx, carrying a message worth showing a person. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

/** Turn FastAPI's error shapes into one sentence. */
function readDetail(body, status) {
  const d = body?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) {
    // 422: [{loc: ["body","email"], msg: "..."}] — name the field, because
    // "value is not a valid email address" alone does not say which one.
    return d.map((e) => {
      const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : ''
      return field ? `${field}: ${e.msg}` : e.msg
    }).join('; ')
  }
  return `Request failed (${status})`
}

let onUnauthorized = () => {}
/** The auth provider registers what to do when a token stops working. */
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export async function request(path, { method = 'GET', body, form, signal } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) {
    payload = form                      // FormData sets its own boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, signal })

  if (res.status === 401) {
    // The token is gone or revoked. Sign out rather than leaving the screen
    // showing stale data it can no longer refresh.
    setToken(null)
    onUnauthorized()
    throw new ApiError(401, 'Your session has ended. Please sign in again.')
  }
  if (res.status === 204) return null
  const text = await res.text()
  const parsed = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, readDetail(parsed, res.status))
  return parsed
}

export const api = {
  get: (p, opts) => request(p, opts),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  upload: (p, formData) => request(p, { method: 'POST', form: formData }),
  /** A file behind sign-in (enquiry attachments), as a Blob. */
  blob: async (p) => {
    const token = getToken()
    const res = await fetch(`${BASE}${p}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    if (res.status === 401) {
      setToken(null)
      onUnauthorized()
      throw new ApiError(401, 'Your session has ended. Please sign in again.')
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new ApiError(res.status, readDetail(body, res.status))
    }
    return res.blob()
  },
}

/** Sign in. The API expects OAuth2 form encoding, not JSON. */
export async function login(email, password) {
  const form = new URLSearchParams({ username: email, password })
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, readDetail(body, res.status))
  setToken(body.access_token)
  return body
}

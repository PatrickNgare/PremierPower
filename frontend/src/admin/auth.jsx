import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, login as apiLogin, setToken, setUnauthorizedHandler } from './api'

const AuthContext = createContext(null)

/** Rank matches the backend's: a role grants everything below it. */
const RANK = { viewer: 0, editor: 1, owner: 2 }

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [ready, setReady] = useState(false)

  const signOut = useCallback(() => {
    setToken(null)
    setAdmin(null)
  }, [])

  // A token that stops working mid-session signs the user out here, not in
  // whichever screen happened to make the call.
  useEffect(() => { setUnauthorizedHandler(() => setAdmin(null)) }, [])

  // Resume a session from a stored token. The token alone is not trusted —
  // /me is what confirms it is still valid and what role it now carries.
  useEffect(() => {
    let alive = true
    if (!getToken()) { setReady(true); return }
    api.get('/admin/me')
      .then((me) => { if (alive) setAdmin(me) })
      .catch(() => { if (alive) setToken(null) })
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [])

  const signIn = useCallback(async (email, password) => {
    await apiLogin(email, password)
    setAdmin(await api.get('/admin/me'))
  }, [])

  const value = useMemo(() => ({
    admin,
    ready,
    signIn,
    signOut,
    /** Can this person write content? */
    can: (minimum = 'editor') => (RANK[admin?.role] ?? -1) >= RANK[minimum],
  }), [admin, ready, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

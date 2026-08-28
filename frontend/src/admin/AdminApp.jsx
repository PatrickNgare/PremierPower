import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { Shell } from './components/Shell'
import { Spinner, ToastProvider } from './components/ui'
import Login from './screens/Login'

const Dashboard = lazy(() => import('./screens/Dashboard'))
const Collection = lazy(() => import('./screens/Collection'))
const Inbox = lazy(() => import('./screens/Inbox'))
const Homepage = lazy(() => import('./screens/Homepage'))
const Menus = lazy(() => import('./screens/Menus'))
const Media = lazy(() => import('./screens/Media'))
const Settings = lazy(() => import('./screens/Settings'))
const Users = lazy(() => import('./screens/Users'))
const Audit = lazy(() => import('./screens/Audit'))

/** Owner-only screens redirect rather than 403, so a demoted editor following
 *  an old link lands somewhere useful instead of on an error. */
function OwnerOnly({ children }) {
  const { can } = useAuth()
  return can('owner') ? children : <Navigate to="/admin" replace />
}

function Authenticated() {
  const { admin, ready } = useAuth()

  if (!ready) return <div className="grid min-h-screen place-items-center bg-paper-warm"><Spinner label="Signing you in" /></div>
  if (!admin) return <Login />

  return (
    <Shell>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="inbox/:id" element={<Inbox />} />
          <Route path="homepage" element={<Homepage />} />
          {/* Every other page uses the same screen, keyed by its route. */}
          <Route path="pages/:page" element={<Homepage />} />
          <Route path="menus" element={<Menus />} />
          <Route path="media" element={<Media />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<OwnerOnly><Users /></OwnerOnly>} />
          <Route path="audit" element={<OwnerOnly><Audit /></OwnerOnly>} />
          <Route path="c/:name" element={<Collection />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}

export default function AdminApp() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Authenticated />
      </AuthProvider>
    </ToastProvider>
  )
}

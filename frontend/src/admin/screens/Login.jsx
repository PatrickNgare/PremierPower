import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../auth'
import { Button } from '../components/ui'
import Logo from '@/components/layout/Logo'
import { useTheme } from '@/hooks/useTheme'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Login() {
  const { isDark } = useTheme()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full rounded-xl border border-neutral-200 bg-surface py-3 pl-11 pr-3.5 text-sm outline-none ' +
    'transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  return (
    <div className="relative grid min-h-screen place-items-center bg-page-warm px-5">
      <ThemeToggle className="absolute right-5 top-5" />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex justify-center"><Logo tone={isDark ? 'dark' : 'light'} /></div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-line bg-surface/80 p-7 shadow-lift backdrop-blur-xl"
        >
          <h1 className="font-display text-xl font-extrabold text-body">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage the Premier Power website.</p>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" aria-label="Email address"
                autoComplete="username" required className={field}
              />
            </div>
            <div className="relative">
              <Lock size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" aria-label="Password"
                autoComplete="current-password" required className={field}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-brand-deep/8 px-3.5 py-2.5 text-sm font-medium text-accent">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" busy={busy} className="mt-6 w-full">
            Sign in
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

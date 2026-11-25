import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '../auth'
import { Button } from '../components/ui'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { photo, cdnWidth } from '@/utils/photo'
import { EASE_OUT } from '@/utils/motion'

/*
 * The CMS front door.
 *
 * Was a lone card on a blank page. Now the same showroom language as the
 * public site: a dark panel of dusk photography — lit buildings, which is
 * what the company actually delivers — beside a plain, well-labelled form.
 * On a phone the panel shrinks to a band above the form.
 */
const SHOTS = [
  { src: '/projects/villa-dusk.jpg', caption: 'Residential · exterior lighting at dusk' },
  { src: '/projects/resort-dusk.jpg', caption: 'Hospitality · resort lighting and power' },
  { src: '/projects/lodge-dusk.jpg', caption: 'Hospitality · lodge façade lighting' },
]
const EVERY = 7000

// The API sleeps on Render's free plan; the first request after a quiet spell
// takes up to a minute. Past this point a spinner alone looks like a hang.
const WAKING_AFTER = 4000

export default function Login() {
  const { signIn } = useAuth()
  const reduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [caps, setCaps] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [waking, setWaking] = useState(false)
  const shake = useAnimationControls()
  const [shot, setShot] = useState(0)
  const emailRef = useRef(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setShot((s) => (s + 1) % SHOTS.length), EVERY)
    return () => clearInterval(t)
  }, [reduce])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const slow = setTimeout(() => setWaking(true), WAKING_AFTER)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check the email and password.')
      // A short shake: the error text says what happened, the movement
      // says where to look.
      if (!reduce) shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.42 } })
    } finally {
      clearTimeout(slow)
      setWaking(false)
      setBusy(false)
    }
  }

  const onKey = (e) => setCaps(e.getModifierState?.('CapsLock') ?? false)

  const field =
    'w-full rounded-xl border border-line bg-surface py-3 pl-11 text-[0.95rem] text-body outline-none ' +
    'placeholder:text-muted/70 transition-all focus:border-brand-fill focus:ring-4 focus:ring-brand-fill/10'

  const current = SHOTS[shot]

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* ── The showroom panel ─────────────────────────────────────────── */}
      <aside className="relative isolate flex h-56 flex-col justify-between overflow-hidden bg-ink-950 p-6 sm:h-64 sm:p-8 lg:sticky lg:top-0 lg:h-screen lg:p-12">
        <AnimatePresence initial={false}>
          <motion.img
            key={current.src}
            src={cdnWidth(photo(current.src), 1600)}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeInOut' },
              scale: { duration: reduce ? 0 : EVERY / 1000 + 1.4, ease: 'linear' },
            }}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/30" />
        {/* Darkens the sky behind the logo; the dusk shots are brightest at the top. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink-950/80 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(40rem_28rem_at_15%_100%,rgb(245_201_123/0.16),transparent_65%)]" />
        <div aria-hidden="true" className="light-beam animate-beam absolute inset-0 -z-10 motion-reduce:animate-none" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10" />

        <a href="/" aria-label="Premier Power — back to the website" className="w-fit">
          <Logo tone="dark" className="h-11 sm:h-12 lg:h-14" />
        </a>

        <div className="max-w-md">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
            className="eyebrow !text-lumen-500"
          >
            <span aria-hidden="true" className="h-px w-6 bg-lumen-500" />
            Content studio
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: EASE_OUT }}
            className="mt-3 hidden font-display text-[clamp(2rem,3.4vw,3rem)] font-extrabold leading-[1.05] text-white lg:block"
          >
            Every page of the site,{' '}
            <span className="text-glow bg-gradient-to-r from-lumen-300 to-lumen-700 bg-clip-text text-transparent">
              lit from one place.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-4 hidden max-w-sm leading-relaxed text-ink-300 lg:block"
          >
            Projects, products, photographs, enquiries and the homepage — edited
            here, live on premierpower.co.ke the moment you publish.
          </motion.p>

          {/* Which photograph, and how long until the next. */}
          <div className="mt-4 flex items-center gap-4 lg:mt-10">
            <div className="flex gap-1.5" aria-hidden="true">
              {SHOTS.map((s, k) => (
                <span key={s.src} className="relative h-0.5 w-8 overflow-hidden rounded-full bg-white/20">
                  {k === shot && (
                    <motion.span
                      key={`${s.src}-${shot}`}
                      initial={{ scaleX: reduce ? 1 : 0 }} animate={{ scaleX: 1 }}
                      transition={{ duration: reduce ? 0 : EVERY / 1000, ease: 'linear' }}
                      className="absolute inset-0 origin-left bg-lumen-500"
                    />
                  )}
                  {k < shot && <span className="absolute inset-0 bg-white/50" />}
                </span>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={current.caption}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="truncate text-xs font-medium text-ink-300"
              >
                {current.caption}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* ── The form ───────────────────────────────────────────────────── */}
      <main className="relative flex min-h-[calc(100vh-14rem)] flex-col px-5 py-6 sm:px-10 lg:min-h-screen lg:py-8">
        <div className="flex items-center justify-between">
          <a href="/" className="group inline-flex items-center gap-2 text-sm font-semibold text-body-soft transition-colors hover:text-body">
            <ArrowLeft size={15} aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-0.5" />
            Back to website
          </a>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: EASE_OUT }}
            className="w-full max-w-[25rem]"
          >
            <p className="eyebrow">Administrators only</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-body sm:text-[2.1rem]">
              Welcome back.
            </h1>
            <p className="mt-2 text-body-soft">Sign in to manage the Premier Power website.</p>

            <motion.form
              onSubmit={submit}
              animate={shake}
              className="mt-8 space-y-5"
            >
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-body">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="login-email" ref={emailRef}
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@premierpower.co.ke"
                    autoComplete="username" inputMode="email" required
                    className={`${field} pr-4`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-body">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="login-password"
                    type={show ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={onKey} onKeyDown={onKey}
                    placeholder="••••••••••"
                    autoComplete="current-password" required
                    aria-describedby={caps ? 'login-caps' : undefined}
                    className={`${field} pr-12`}
                  />
                  <button
                    type="button" onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
                    className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-page-warm hover:text-body"
                  >
                    {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
                <AnimatePresence>
                  {caps && (
                    <motion.p
                      id="login-caps"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 text-xs font-semibold text-accent"
                    >
                      Caps Lock is on.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="rounded-xl border border-brand-deep/15 bg-brand-deep/8 px-4 py-3 text-sm font-medium text-accent"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button type="submit" variant="primary" busy={busy} className="w-full !py-3.5 !text-[0.95rem]">
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>

              <AnimatePresence>
                {waking && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-center text-sm text-muted"
                  >
                    Waking the server — after a quiet spell the first sign-in can take up to a minute.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.form>

            <p className="mt-10 border-t border-line pt-5 text-sm leading-relaxed text-muted">
              Trouble signing in? Ask whoever runs the website to check your account.
            </p>
          </motion.div>
        </div>

        <p className="text-xs text-muted">© {new Date().getFullYear()} Premier Power Limited</p>
      </main>
    </div>
  )
}

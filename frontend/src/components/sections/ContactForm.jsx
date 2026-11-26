import { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Send, CheckCircle2, AlertCircle, Loader2, Paperclip, X } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import Magnetic from '@/components/ui/Magnetic'
import { whatsappLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'
import { track } from '@/utils/analytics'

const API = import.meta.env.VITE_API_URL ?? '/api'

const PROJECT_TYPES = [
  'Hotel, lodge or resort',
  'Commercial interior',
  'Office or bank',
  'Residential development',
  'Health care facility',
  'Institution',
  'Industrial project',
  'Other',
]

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** The same rules the server applies, checked first so a mistake is named
 *  beside the field instead of coming back as "that did not send". */
function check(d) {
  const e = {}
  if (!d.name?.trim()) e.name = 'Please enter your name.'
  if ((d.phone ?? '').replace(/\D/g, '').length < 7) e.phone = 'Please enter a phone number we can call.'
  if (d.email?.trim() && !EMAIL_RE.test(d.email.trim())) e.email = 'That email address looks incomplete.'
  return e
}

// Drawings and documents sent with an enquiry. Same limits as the server
// (backend/app/core/attachments.py), checked here so a mistake is named at
// once rather than after an upload.
const MAX_FILES = 3
const MAX_MB = 10
const FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const prettySize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

// The API sleeps on Render's free plan and can take up to a minute to answer
// the first request after a quiet spell.
const WAKING_AFTER = 4000
const GIVE_UP_AFTER = 90000

export default function ContactForm({ compact = false }) {
  const reduce = useReducedMotion()
  const [files, setFiles] = useState([])
  const fileRef = useRef(null)
  const site = useSite()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [waking, setWaking] = useState(false)
  const formRef = useRef(null)
  const wa = whatsappLink(site)

  function addFiles(list) {
    const picked = [...list]
    const next = [...files]
    let problem = ''
    for (const f of picked) {
      if (next.length >= MAX_FILES) { problem = `Attach up to ${MAX_FILES} files.`; break }
      if (!FILE_TYPES.includes(f.type)) { problem = `${f.name} is not a PDF, JPG or PNG.`; continue }
      if (f.size > MAX_MB * 1048576) { problem = `${f.name} is over ${MAX_MB} MB. Send larger drawings by email instead.`; continue }
      next.push(f)
    }
    setFiles(next)
    setErrors((x) => ({ ...x, files: problem || undefined }))
    if (fileRef.current) fileRef.current.value = ''
  }

  // Clear a field's message as soon as it is being fixed.
  const clear = (name) => () => setErrors((x) => (x[name] ? { ...x, [name]: undefined } : x))

  async function onSubmit(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    const found = check(data)
    setErrors(found)
    if (Object.keys(found).length) {
      setStatus('idle')
      // Put the cursor in the first field that needs attention.
      const first = ['name', 'email', 'phone'].find((k) => found[k])
      formRef.current?.querySelector(`[name="${first}"]`)?.focus()
      return
    }

    setStatus('sending'); setError('')
    const slow = setTimeout(() => setWaking(true), WAKING_AFTER)
    const abort = new AbortController()
    const giveUp = setTimeout(() => abort.abort(), GIVE_UP_AFTER)
    try {
      let res
      if (files.length) {
        // Multipart only when there is something to attach; the plain JSON
        // endpoint stays the common path.
        const body = new FormData()
        for (const [k, v] of Object.entries(data)) body.append(k, v)
        files.forEach((f) => body.append('files', f, f.name))
        res = await fetch(`${API}/leads/with-files`, { method: 'POST', body, signal: abort.signal })
      } else {
        res = await fetch(`${API}/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: abort.signal,
        })
      }
      if ([413, 415].includes(res.status) || (res.status === 422 && files.length)) {
        const body = await res.clone().json().catch(() => null)
        if (typeof body?.detail === 'string') {
          setErrors({ files: body.detail })
          setStatus('idle')
          return
        }
      }
      if (res.status === 422) {
        // The server disagreed with something the checks above let through.
        // Show its reason beside the field rather than a generic failure.
        const body = await res.json().catch(() => null)
        const server = {}
        for (const d of body?.detail ?? []) {
          const field = d.loc?.[d.loc.length - 1]
          if (field) server[field] = String(d.msg).replace(/^Value error, /, '')
        }
        setErrors(server)
        setStatus('idle')
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
      track('generate_lead', { form: compact ? 'home' : 'contact', project_type: data.project_type || '', files: files.length })
    } catch {
      setStatus('error')
      setError(
        wa
          ? 'That did not send. Message us on WhatsApp instead and it will reach us immediately.'
          : 'That did not send. Please try again in a moment.',
      )
    } finally {
      clearTimeout(slow); clearTimeout(giveUp); setWaking(false)
    }
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="card-lift relative overflow-hidden p-10 text-center"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(20rem 14rem at 50% 0%, rgb(245 201 123 / 0.22), transparent 70%)' }}
            />
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-earth-ink/10"
            >
              {/* One ring of current confirming the connection, once — the
                  same "acknowledged" language as the rest of the site's
                  power motifs, scaled down to a single quiet pulse rather
                  than the hero's filament. Decorative, so it skips entirely
                  under reduced motion rather than just going instant. */}
              {!reduce && (
                <motion.span
                  aria-hidden="true"
                  initial={{ scale: 0.8, opacity: 0.55 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-full border border-earth-ink/50"
                />
              )}
              <CheckCircle2 size={26} className="text-earth-ink" aria-hidden="true" />
            </motion.span>
            <h3 className="relative mt-6 font-display text-2xl font-bold text-body">That reached us.</h3>
            <p className="relative mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-body-soft">
              We will come back to you with next steps. If it is urgent, call directly rather
              than wait for our reply.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="card-lift p-6 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" name="name" required autoComplete="name"
                error={errors.name} onChange={clear('name')} maxLength={120} />
              <Field label="Phone" name="phone" type="tel" required autoComplete="tel" inputMode="tel"
                error={errors.phone} onChange={clear('phone')} maxLength={60} />
              {!compact && (
                <>
                  <Field label="Company" name="company" autoComplete="organization"
                    error={errors.company} maxLength={160} />
                  <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email"
                    error={errors.email} onChange={clear('email')} maxLength={200} />
                  <Field label="Location" name="area" error={errors.area} maxLength={120} />
                </>
              )}
              <Field label="Project type" name="project_type" as="select" options={PROJECT_TYPES}
                className={compact ? 'sm:col-span-2' : ''} />
              <Field
                label="Tell us about the project" name="message" as="textarea" rows={compact ? 3 : 5}
                className="sm:col-span-2" error={errors.message} maxLength={4000}
              />

              {/* Drawings, tender documents, site photos. Kept private: only
                  staff signed in to the CMS can open them. */}
              <div className="sm:col-span-2">
                <input
                  ref={fileRef} id="cf-files" type="file" multiple className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => addFiles(e.target.files)}
                  aria-describedby="cf-files-help"
                />
                <label
                  htmlFor="cf-files"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold transition-colors ${
                    files.length >= MAX_FILES ? 'pointer-events-none opacity-50' : 'hover:border-brand-fill hover:text-accent'
                  } ${errors.files ? 'border-brand-fill text-accent' : 'border-line text-body-soft'}`}
                >
                  <Paperclip size={15} aria-hidden="true" /> Attach drawings or documents
                </label>
                <p id="cf-files-help" className="mt-1.5 text-xs text-muted">
                  Optional. Up to {MAX_FILES} PDF, JPG or PNG files, {MAX_MB} MB each. Only our team can open them.
                </p>
                {errors.files && <p className="mt-1.5 text-sm font-medium text-accent" role="alert">{errors.files}</p>}
                {files.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-page-warm px-3 py-2 text-sm">
                        <span className="min-w-0 truncate text-body">{f.name} <span className="text-muted">· {prettySize(f.size)}</span></span>
                        <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          aria-label={`Remove ${f.name}`} className="shrink-0 rounded-md p-1 text-muted hover:bg-surface hover:text-accent">
                          <X size={14} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Spam trap: off-screen and skipped by keyboard and screen
                readers, so only a bot fills it in. The server quietly drops
                any enquiry that has it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="cf-website">Website</label>
              <input id="cf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <AnimatePresence>
              {status === 'error' && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 flex items-start gap-2.5 overflow-hidden rounded-xl bg-brand-fill/[0.06] px-4 py-3 text-sm leading-relaxed text-body-strong"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  <span>
                    {error}{' '}
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                        Open WhatsApp
                      </a>
                    )}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Magnetic>
                <button type="submit" disabled={status === 'sending'} className="btn-primary group disabled:cursor-not-allowed disabled:opacity-60">
                  {status === 'sending' ? (
                    <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</>
                  ) : (
                    <>Send project enquiry
                      <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:-translate-y-1 group-active:duration-150" aria-hidden="true" />
                    </>
                  )}
                </button>
              </Magnetic>
              <p className="text-sm text-muted" role="status">
                {waking
                  ? 'Still sending — the first message after a quiet spell can take up to a minute.'
                  : 'We reply to every enquiry.'}
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

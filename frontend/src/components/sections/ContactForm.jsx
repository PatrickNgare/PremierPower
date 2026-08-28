import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import Magnetic from '@/components/ui/Magnetic'
import { whatsappLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'

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

export default function ContactForm() {
  const site = useSite()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const wa = whatsappLink(site)

  async function onSubmit(e) {
    e.preventDefault()
    setStatus('sending'); setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    try {
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(String(res.status))
      setStatus('sent')
    } catch {
      setStatus('error')
      setError(
        wa
          ? 'That did not send. Message us on WhatsApp instead and it will reach us immediately.'
          : 'That did not send. Please try again in a moment.',
      )
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
              <CheckCircle2 size={26} className="text-earth-ink" aria-hidden="true" />
            </motion.span>
            <h3 className="relative mt-6 font-display text-2xl font-bold text-ink-900">That reached us.</h3>
            <p className="relative mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-600">
              We will come back to you with next steps. If it is urgent, call directly rather
              than wait for our reply.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="card-lift p-6 sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your name" name="name" required autoComplete="name" />
              <Field label="Company" name="company" autoComplete="organization" />
              <Field label="Email" name="email" type="email" autoComplete="email" />
              <Field label="Phone" name="phone" type="tel" required autoComplete="tel" />
              <Field label="Location" name="area" />
              <Field label="Project type" name="project_type" as="select" options={PROJECT_TYPES} />
              <Field
                label="Tell us about the project" name="message" as="textarea" rows={5}
                className="sm:col-span-2"
              />
            </div>

            <AnimatePresence>
              {status === 'error' && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 flex items-start gap-2.5 overflow-hidden rounded-xl bg-brand-fill/[0.06] px-4 py-3 text-sm leading-relaxed text-ink-800"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-deep" aria-hidden="true" />
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
                      <Send size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </Magnetic>
              <p className="text-sm text-ink-400">We reply to every enquiry.</p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

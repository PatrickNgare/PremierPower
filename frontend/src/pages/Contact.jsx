import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FaWhatsapp } from 'react-icons/fa'
import { FiPhone, FiCheckCircle, FiMapPin, FiClock } from 'react-icons/fi'
import PageHero from '@/components/ui/PageHero'
import Button from '@/components/ui/Button'
import LicenseBadge from '@/components/ui/LicenseBadge'
import Spinner from '@/components/ui/Spinner'
import { site, isPending, value, whatsappLink, telLink } from '@/config/site'

const API = import.meta.env.VITE_API_URL ?? '/api'

const field =
  'mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 ' +
  'placeholder:text-neutral-400 transition-colors duration-200 hover:border-neutral-400 focus:border-secondary-dark focus:outline-none'

export default function Contact() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const wa = whatsappLink()
  const tel = telLink()

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
      setError(wa
        ? 'We could not send that just now. Message us on WhatsApp instead and it will reach us immediately.'
        : 'We could not send that just now. Please try again in a moment.')
    }
  }

  return (
    <>
      <Helmet>
        <title>Book a free site assessment | Premier Power</title>
        <meta name="description" content="Book a free, no-obligation electrical site assessment in Nairobi. We test the existing installation, photograph what we find, and put the findings in writing." />
        <link rel="canonical" href="https://premierpower.co.ke/contact" />
      </Helmet>

      <PageHero
        crumb="Contact" eyebrow="Free, about an hour"
        title="Book a free site assessment."
        lede="We open the board, test what is there, photograph it, and give you the findings in writing — including the parts that are fine. No obligation, and we do not send a salesperson."
      />

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-heading text-xl font-semibold text-primary">Reach us directly</h2>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col">
              {wa && (
                <Button href={wa} variant="outline" target="_blank" rel="noopener noreferrer" className="justify-start">
                  <FaWhatsapp size={18} aria-hidden="true" /> WhatsApp us
                </Button>
              )}
              {tel && (
                <Button href={tel} variant="outline" className="justify-start">
                  <FiPhone size={16} aria-hidden="true" /> {String(site.phone)}
                </Button>
              )}
            </div>

            {(isPending(site.phone) || isPending(site.whatsapp)) && (
              <p className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
                Phone and WhatsApp numbers are pending. Both must be confirmed live before launch.
              </p>
            )}

            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex gap-3">
                <FiMapPin size={16} className="mt-0.5 shrink-0 text-secondary-accent" aria-hidden="true" />
                <span className="text-neutral-600">
                  {isPending(site.serviceArea) ? 'Service area pending' : value(site.serviceArea)}
                </span>
              </li>
              <li className="flex gap-3">
                <FiClock size={16} className="mt-0.5 shrink-0 text-secondary-accent" aria-hidden="true" />
                <span className="text-neutral-600">We reply to every request, usually the same day.</span>
              </li>
            </ul>

            <LicenseBadge className="mt-8" />
          </div>

          <div>
            {status === 'sent' ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8">
                <p className="flex items-center gap-3 font-heading text-xl font-semibold text-primary">
                  <FiCheckCircle size={22} className="text-earth-ink" aria-hidden="true" /> That reached us.
                </p>
                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-neutral-600">
                  We will call to agree a time for the assessment. If it is urgent — burning smell,
                  scorch marks, repeated tripping — call rather than wait for us.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Your name</span>
                    <input name="name" required autoComplete="name" className={field} placeholder="Jane Wanjiru" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Phone</span>
                    <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="07xx xxx xxx" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Area</span>
                    <input name="area" className={field} placeholder="Kilimani, Nairobi" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Property</span>
                    <select name="property" defaultValue="apartment" className={field}>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="rental">Rental I manage</option>
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-neutral-700">What is happening?</span>
                    <textarea name="message" rows="4" className={field}
                      placeholder="Breakers tripping in the kitchen, and one socket is warm to the touch." />
                  </label>
                </div>

                {status === 'error' && (
                  <p role="alert" className="mt-5 rounded-lg border-l-2 border-secondary-deep bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
                    {error}{' '}
                    {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Open WhatsApp</a>}
                  </p>
                )}

                <Button type="submit" variant="primaryLg" disabled={status === 'sending'}
                  className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60">
                  {status === 'sending' ? <><Spinner size={17} /> Sending…</> : 'Request my free assessment'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import SectionHeader from '../components/SectionHeader'
import LicenseBadge from '../components/LicenseBadge'
import Button from '../components/Button'
import { site, isPending, whatsappLink, telLink } from '../config/site'
import { PhoneIcon, WhatsAppIcon, CheckIcon } from './../components/Icons'

const API = import.meta.env.VITE_API_URL ?? '/api'

const field =
  'mt-1.5 w-full rounded-xl border border-graphite-900/20 bg-plaster-50 px-4 py-3 text-graphite-900 placeholder:text-graphite-400 transition-colors duration-200 hover:border-graphite-900/35 focus:border-amber-600 focus:outline-none focus-visible:outline-none'

export default function Contact() {
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')
  const wa = whatsappLink()
  const tel = telLink()

  async function onSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const data = Object.fromEntries(new FormData(e.currentTarget))
    try {
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(
        wa
          ? 'We could not send that just now. Message us on WhatsApp instead and it will reach us immediately.'
          : 'We could not send that just now. Please try again in a moment.',
      )
    }
  }

  return (
    <>
      <Helmet>
        <title>Book a free site assessment | PremierPower</title>
        <meta name="description" content="Book a free, no-obligation electrical site assessment in Nairobi. We test the existing installation, photograph what we find, and put the findings in writing." />
        <link rel="canonical" href="https://premierpower.co.ke/contact" />
      </Helmet>

      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeader
              title="Book a free site assessment."
              lede="About an hour. We open the board, test what is there, photograph it, and give you the findings in writing — including the parts that are fine. No obligation, and we do not send a salesperson."
            />

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {wa && (
                <Button href={wa} variant="outline" size="lg" target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon width="20" height="20" /> WhatsApp
                </Button>
              )}
              {tel && (
                <Button href={tel} variant="outline" size="lg">
                  <PhoneIcon width="20" height="20" /> {String(site.phone)}
                </Button>
              )}
            </div>

            {(isPending(site.phone) || isPending(site.whatsapp)) && (
              <p className="mt-4 rounded-xl border border-dashed border-graphite-900/25 px-4 py-3 text-sm text-graphite-500">
                Phone and WhatsApp numbers are pending. Both must be confirmed live before launch.
              </p>
            )}

            <LicenseBadge className="mt-8" />
          </div>

          <div>
            {status === 'sent' ? (
              <div className="rounded-xl border border-graphite-900/15 bg-plaster-50 p-8">
                <p className="flex items-center gap-3 text-xl text-graphite-900">
                  <CheckIcon width="22" height="22" /> That reached us.
                </p>
                <p className="mt-3 max-w-[52ch] leading-relaxed text-graphite-500">
                  We will call to agree a time for the assessment. If it is urgent — burning
                  smell, scorch marks, repeated tripping — call rather than wait for us.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="rounded-xl border border-graphite-900/15 bg-plaster-50 p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-1">
                    <span className="text-sm text-graphite-700">Your name</span>
                    <input name="name" required autoComplete="name" className={field} placeholder="Jane Wanjiru" />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="text-sm text-graphite-700">Phone</span>
                    <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="07xx xxx xxx" />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="text-sm text-graphite-700">Area</span>
                    <input name="area" className={field} placeholder="Kilimani, Nairobi" />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="text-sm text-graphite-700">Property</span>
                    <select name="property" defaultValue="apartment" className={field}>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="rental">Rental I manage</option>
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm text-graphite-700">What is happening?</span>
                    <textarea
                      name="message" rows="4" className={field}
                      placeholder="Breakers tripping in the kitchen, and one socket is warm to the touch."
                    />
                  </label>
                </div>

                {status === 'error' && (
                  <p role="alert" className="mt-5 border-l border-amber-600 pl-4 text-sm leading-relaxed text-graphite-800">
                    {error}{' '}
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        Open WhatsApp
                      </a>
                    )}
                  </p>
                )}

                <Button
                  as="button" type="submit" size="lg"
                  disabled={status === 'sending'}
                  className="mt-7 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending…' : 'Request my free assessment'}
                </Button>

                <p className="mt-4 text-center text-sm text-graphite-500">
                  We reply to every request, usually the same day.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

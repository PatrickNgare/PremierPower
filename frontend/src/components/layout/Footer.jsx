import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, MessageCircle, ArrowUpRight } from 'lucide-react'
import Logo from './Logo'
import { isPending, value, whatsappLink, telLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'

const columns = [
  {
    heading: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/portfolio', label: 'Projects' },
      { to: '/safety', label: 'Safety & compliance' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { to: '/services', label: 'Electrical installation' },
      { to: '/services', label: 'Lighting' },
      { to: '/services', label: 'Solar & power continuity' },
      { to: '/services', label: 'Security systems' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { to: '/faq', label: 'Frequently asked questions' },
      { to: '/testimonials', label: 'Client references' },
      { to: '/portfolio', label: 'Project gallery' },
      { to: '/contact', label: 'Request a quote' },
    ],
  },
]

function Detail({ icon: Icon, label, v, href }) {
  const pending = isPending(v)
  const body = pending ? '—' : value(v)
  return (
    <li className="flex items-start gap-3 text-sm">
      <Icon size={15} className="mt-0.5 shrink-0 text-lumen-500" aria-hidden="true" />
      {href && !pending ? (
        <a href={href} className="text-ink-300 transition-colors hover:text-white">{body}</a>
      ) : (
        <span className={pending ? 'text-white/25' : 'text-ink-300'}>
          {body}<span className="sr-only">{pending ? ` ${label} not yet confirmed` : ''}</span>
        </span>
      )}
    </li>
  )
}

export default function Footer() {
  const site = useSite()
  const wa = whatsappLink(site)
  const tel = telLink(site)

  return (
    <footer className="on-dark relative isolate overflow-hidden bg-ink-950">
      <div aria-hidden="true" className="ambient-warm absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden="true" className="rule-fade absolute inset-x-0 top-0 h-px text-white/15" />

      <div className="container-x py-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Logo tone="dark" className="h-11" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-400">
              Electrical engineering and lighting installation across Kenya — for the
              corporate, commercial and residential markets.
            </p>
            <div className="mt-7 flex gap-2.5">
              {wa && (
                <a
                  href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-lumen-500 hover:text-lumen-500"
                >
                  <MessageCircle size={17} aria-hidden="true" />
                </a>
              )}
              {tel && (
                <a
                  href={tel} aria-label="Call Premier Power"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-lumen-500 hover:text-lumen-500"
                >
                  <Phone size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">
                {col.heading}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="group inline-flex items-center gap-1 text-sm text-ink-400 transition-colors hover:text-white"
                    >
                      {l.label}
                      <ArrowUpRight
                        size={13}
                        className="opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">Contact</h2>
            <ul className="mt-5 space-y-3">
              <Detail icon={Phone} label="phone" v={site.phone} href={tel} />
              <Detail icon={Phone} label="second phone" v={site.secondPhone} />
              <Detail icon={Mail} label="email" v={site.email} href={isPending(site.email) ? null : `mailto:${value(site.email)}`} />
              <Detail icon={MapPin} label="address" v={site.street} />
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">Registration</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-400">NCA</dt>
                <dd className={isPending(site.ncaNumber) ? 'text-white/25' : 'text-ink-300'}>
                  {isPending(site.ncaNumber) ? 'Registered' : value(site.ncaNumber)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-400">Category</dt>
                <dd className="text-right text-ink-300">{value(site.ncaCategory, '—')}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-white">Hours</h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-400">
              Monday to Friday, 8am – 5pm<br />
              Saturday by arrangement<br />
              <span className="text-ink-300">Site emergencies — call directly</span>
            </p>
          </div>
        </div>

        <p className="mt-14 border-t border-white/10 pt-8 text-sm text-ink-400">
          © {new Date().getFullYear()} {isPending(site.legalName) ? site.name : value(site.legalName)}.
          {' '}Electrical engineering service contractor, registered with the National Construction Authority.
        </p>
      </div>
    </footer>
  )
}

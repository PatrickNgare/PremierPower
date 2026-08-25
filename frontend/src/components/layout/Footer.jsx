import { Link } from 'react-router-dom'
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { navLinks } from './navLinks'
import Logo from './Logo'
import { site, isPending, value, whatsappLink, telLink } from '@/config/site'

function Row({ label, v, icon: Icon }) {
  const unconfirmed = isPending(v)
  return (
    <li className="flex items-start gap-3 py-1.5 text-sm">
      {Icon && <Icon size={15} className="mt-0.5 shrink-0 text-secondary-accent" aria-hidden="true" />}
      <span className="text-white/50">{label}</span>
      <span className={`ml-auto text-right ${unconfirmed ? 'text-white/30' : 'text-white'}`}>
        {unconfirmed ? '—' : value(v)}
      </span>
    </li>
  )
}

export default function Footer() {
  const wa = whatsappLink()
  const tel = telLink()

  return (
    <footer className="on-dark bg-primary-dark">
      <div className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo tone="dark" className="h-12" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">{site.tagline}</p>
            <div className="mt-6 flex gap-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-secondary-dark">
                  <FaWhatsapp size={18} aria-hidden="true" />
                </a>
              )}
              {tel && (
                <a href={tel} aria-label="Call us"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-secondary-dark">
                  <FiPhone size={17} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Pages</h2>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 transition-colors hover:text-secondary-accent">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Contact</h2>
            <ul className="mt-4">
              <Row label="Phone" v={site.phone} icon={FiPhone} />
              <Row label="Email" v={site.email} icon={FiMail} />
              <Row label="Area" v={site.serviceArea} icon={FiMapPin} />
            </ul>
          </div>

          {/* Licensing sits in the footer of every page, never buried. */}
          <div>
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Licensing</h2>
            <ul className="mt-4">
              <Row label="NCA registration" v={site.ncaNumber} />
              <Row label="Category" v={site.ncaCategory} />
              <Row label="Insured by" v={site.insured} />
              <Row label="Warranty" v={site.warranty} />
            </ul>
          </div>
        </div>

        <p className="mt-14 border-t border-white/10 pt-6 text-sm text-white/45">
          © {new Date().getFullYear()} {isPending(site.legalName) ? site.name : value(site.legalName)}.
          Electrical engineering service contractor, registered with the National Construction Authority.
        </p>
      </div>
    </footer>
  )
}

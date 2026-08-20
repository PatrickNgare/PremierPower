import { Link } from 'react-router-dom'
import { navLinks } from './navLinks'
import { site, isPending, value } from '../config/site'

function Field({ label, v, mono }) {
  const unconfirmed = isPending(v)
  return (
    <div className="flex justify-between gap-6 border-t border-plaster-100/12 py-2.5">
      <dt className="text-buried-300">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono tabular' : ''} ${unconfirmed ? 'text-buried-300/55' : 'text-plaster-100'}`}>
        {unconfirmed ? '—' : value(v)}
      </dd>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-buried-800 on-dark">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-semibold text-plaster-50">
              Premier<span className="text-amber-500">Power</span>
            </p>
            <p className="secondary mt-3 max-w-[38ch] leading-relaxed">{site.tagline}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-xs uppercase tracking-wider text-buried-300">Pages</h2>
            <ul className="mt-4 space-y-2">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-plaster-100/85 transition-colors hover:text-plaster-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Licensing sits in the footer of every page, never buried. */}
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-buried-300">Licensing</h2>
            <dl className="mt-4 text-sm">
              <Field label="EPRA licence" v={site.epraNumber} mono />
              <Field label="Class" v={site.epraClass} mono />
              <Field label="Insured by" v={site.insured} />
              <Field label="Service area" v={site.serviceArea} />
            </dl>
          </div>
        </div>

        <p className="secondary mt-14 border-t border-plaster-100/12 pt-6 text-sm">
          © {new Date().getFullYear()} {isPending(site.legalName) ? site.name : value(site.legalName)}.
          Wiring to KEBS standards, tested and certified.
        </p>
      </div>
    </footer>
  )
}

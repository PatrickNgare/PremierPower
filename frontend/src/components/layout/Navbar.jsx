import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiPhone } from 'react-icons/fi'
import { navLinks } from './navLinks'
import Logo from './Logo'
import MobileMenu from './MobileMenu'
import Button from '@/components/ui/Button'
import { site, isPending, telLink } from '@/config/site'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const tel = telLink()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Utility bar — licence and phone above the fold on every page. */}
      <div className="on-dark hidden bg-primary-dark lg:block">
        <div className="container-x flex h-9 items-center justify-between text-xs text-white/70">
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-1 rounded-full bg-earth" />
            EPRA-licensed residential wiring · Nairobi
          </p>
          {tel ? (
            <a href={tel} className="flex items-center gap-2 font-semibold text-white hover:text-secondary-accent">
              <FiPhone size={13} aria-hidden="true" /> {String(site.phone)}
            </a>
          ) : (
            <span className="text-white/40">Phone number pending</span>
          )}
        </div>
      </div>

      <header className={`sticky top-0 z-40 transition-shadow duration-300 ${
        solid ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        <nav className="container-x flex h-18 items-center gap-6 py-3" aria-label="Main">
          <Link to="/" aria-label="Premier Power Limited — home" className="shrink-0">
            <Logo className="h-9 sm:h-11" />
          </Link>

          <ul className="ml-auto hidden items-center gap-6 xl:flex">
            {navLinks.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `relative py-2 text-sm font-medium transition-colors duration-200 hover:text-secondary-accent ${
                      isActive ? 'text-secondary-accent' : 'text-neutral-700'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      <span aria-hidden="true" className={`absolute -bottom-0.5 left-0 h-0.5 w-full rounded bg-secondary transition-transform duration-200 ${
                        isActive ? 'scale-x-100' : 'scale-x-0'
                      }`} />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto hidden xl:ml-0 xl:block">
            <Button to="/contact" className="px-6 py-3">Free site assessment</Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="ml-auto rounded-lg p-2 text-primary transition-colors hover:bg-neutral-100 xl:hidden"
          >
            <FiMenu size={24} aria-hidden="true" />
          </button>
        </nav>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}

import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, Phone, ArrowRight } from 'lucide-react'
import { navLinks } from './navLinks'
import Logo from './Logo'
import MobileMenu from './MobileMenu'
import Magnetic from '@/components/ui/Magnetic'
import { site, telLink } from '@/config/site'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const { scrollY } = useScroll()
  const { pathname } = useLocation()
  const tel = telLink()

  // Condense past the fold rather than on the first pixel, so the bar does not
  // flicker when a trackpad nudges the page.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setCondensed((prev) => (prev ? y > 40 : y > 110))
  })

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: condensed ? 'rgba(252,252,251,0.86)' : 'rgba(252,252,251,1)',
          boxShadow: condensed ? '0 1px 0 rgba(8,8,10,0.07), 0 10px 30px -18px rgba(8,8,10,0.4)' : '0 0 0 rgba(0,0,0,0)',
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 backdrop-blur-md"
      >
        <nav className="container-x flex items-center gap-6" aria-label="Main">
          <motion.div
            initial={false}
            animate={{ height: condensed ? 62 : 84 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 items-center gap-6"
          >
            <Link to="/" aria-label="Premier Power Limited — home" className="shrink-0">
              <motion.div initial={false} animate={{ scale: condensed ? 0.86 : 1 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="origin-left">
                <Logo className="h-9 sm:h-11" />
              </motion.div>
            </Link>

            <p className="ml-6 hidden items-center gap-2 whitespace-nowrap text-xs text-ink-500 xl:flex">
              <span aria-hidden="true" className="inline-block h-2.5 w-1 rounded-full bg-earth-ink" />
              NCA registered · Nationwide
            </p>

            <ul className="ml-auto hidden items-center gap-0.5 lg:flex xl:gap-1">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `relative rounded-full px-3 py-2 text-[0.83rem] font-medium xl:px-3.5 xl:text-sm transition-colors duration-300 ${
                        isActive ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            className="absolute inset-0 -z-10 rounded-full bg-ink-900/[0.06]"
                            aria-hidden="true"
                          />
                        )}
                        {l.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* A number set as text competes with the nav links for the same
                attention. As a quiet icon control it stays one tap away
                without reading as a ninth menu item; the number itself is on
                the contact page, in the CTA band and in the footer. */}
            {tel && (
              <a
                href={tel}
                title={`Call ${String(site.phone)}`}
                aria-label={`Call Premier Power on ${String(site.phone)}`}
                className="ml-auto hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-900/12 text-ink-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb))] hover:text-[rgb(var(--accent-rgb))] lg:ml-0 lg:flex"
              >
                <Phone size={16} aria-hidden="true" />
              </a>
            )}

            <div className="hidden lg:block">
              <Magnetic strength={0.2}>
                <Link to="/contact" className="btn-primary group whitespace-nowrap px-5 py-3 text-sm">
                  Request a quote
                  <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </Magnetic>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              className="ml-auto rounded-full p-2.5 text-ink-900 transition-colors hover:bg-ink-900/[0.06] lg:hidden"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </motion.div>
        </nav>

        {/* Scroll progress — a thin filament of light across the bar. */}
        <ScrollFilament />
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} key={pathname} />
    </>
  )
}

function ScrollFilament() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-brand via-lumen-500 to-brand"
    />
  )
}

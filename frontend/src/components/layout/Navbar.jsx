import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, Phone, ArrowRight } from 'lucide-react'
import { useMenu } from '@/hooks/useMenu'
import Logo from './Logo'
import MobileMenu from './MobileMenu'
import Magnetic from '@/components/ui/Magnetic'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { telLink } from '@/config/site'
import { useSite } from '@/hooks/useSite'
import { useTheme } from '@/hooks/useTheme'

export default function Navbar() {
  const site = useSite()
  const { isDark } = useTheme()
  const navLinks = useMenu('header')
  const [open, setOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const { scrollY } = useScroll()
  const { pathname } = useLocation()
  const tel = telLink(site)

  // Condense past the fold rather than on the first pixel, so the bar does not
  // flicker when a trackpad nudges the page.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setCondensed((prev) => (prev ? y > 40 : y > 110))
  })

  return (
    <>
      <header
        data-condensed={condensed}
        className="navbar-surface sticky top-0 z-40 backdrop-blur-md"
      >
        <nav className="container-x flex items-center gap-6" aria-label="Main">
          <motion.div
            initial={false}
            animate={{ height: condensed ? 62 : 84 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 items-center gap-6"
          >
            {/* Three zones, with the outer two flexing equally so the nav sits
                on the centre of the page rather than in the middle of whatever
                is left over. Pushed right by ml-auto it left a 183px hole after
                the logo; centred in the leftover space it leaned the other way,
                because the logo and the buttons are not the same width. Equal
                flanks are what actually centres it. */}
            <div className="flex flex-1 items-center gap-6">
              <Link to="/" aria-label="Premier Power Limited — home" className="shrink-0">
                <motion.div initial={false} animate={{ scale: condensed ? 0.86 : 1 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="origin-left">
                  <Logo tone={isDark ? 'dark' : 'light'} className="h-9 sm:h-11" />
                </motion.div>
              </Link>

              {/* The "NCA registered · Nationwide" strapline used to sit here.
                  It was the widest non-navigation thing in the row and caused
                  trouble twice: it pushed the quote button off the right edge
                  once the nav reached nine links, and once the nav was centred
                  it overlapped the first link at 2xl, because the nav cannot
                  shrink and this could not either. The claim is already made on
                  every page in the trust bar and again in the footer, so the
                  header is better without it. */}
            </div>

            <ul className="hidden shrink-0 items-center gap-0.5 lg:flex xl:gap-1">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      // whitespace-nowrap: labels come from the CMS and can be
                      // any length. "Lighting & fittings" wrapped onto three
                      // lines and pushed the header to twice its height.
                      `relative whitespace-nowrap rounded-full px-2.5 py-2 text-[0.83rem] font-medium xl:px-3 xl:text-sm transition-colors duration-300 ${
                        isActive ? 'text-body' : 'text-body-soft hover:text-body'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            className="absolute inset-0 -z-10 rounded-full bg-surface-2"
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

            <div className="flex flex-1 items-center justify-end gap-3">
              {/* A number set as text competes with the nav links for the same
                  attention. As a quiet icon control it stays one tap away
                  without reading as a tenth menu item; the number itself is on
                  the contact page, in the CTA band and in the footer. */}
              <ThemeToggle className="hidden lg:flex" />

              {tel && (
                <a
                  href={tel}
                  title={`Call ${String(site.phone)}`}
                  aria-label={`Call Premier Power on ${String(site.phone)}`}
                  className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-body-mid transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb))] hover:text-[rgb(var(--accent-rgb))] lg:flex"
                >
                  <Phone size={16} aria-hidden="true" />
                </a>
              )}

              {/* From xl, not lg. Between 1024 and 1279 the nine nav links and
                  the logo already fill the row, and this button was overflowing
                  the viewport. Contact is a nav link at those widths, and the
                  phone control sits beside it, so nothing becomes unreachable. */}
              <div className="hidden xl:block">
                <Magnetic strength={0.2}>
                  <Link to="/contact" className="btn-primary group whitespace-nowrap px-5 py-3 text-sm">
                    Request a quote
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1.5 group-active:duration-150" aria-hidden="true" />
                  </Link>
                </Magnetic>
              </div>

              <ThemeToggle className="lg:hidden" />

              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                aria-expanded={open}
                className="flex h-11 w-11 items-center justify-center rounded-full text-body transition-colors hover:bg-surface-2 lg:hidden"
              >
                <Menu size={22} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </nav>

        {/* Scroll progress — a thin filament of light across the bar. */}
        <ScrollFilament />
      </header>

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

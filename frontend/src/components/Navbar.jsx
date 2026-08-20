import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { navLinks } from './navLinks'
import Button from './Button'
import MobileMenu from './MobileMenu'
import { MenuIcon } from './Icons'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
          lifted
            ? 'border-graphite-900/10 bg-plaster-100/90 backdrop-blur-sm'
            : 'border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-18 max-w-6xl items-center gap-6 px-5 py-4 sm:px-8" aria-label="Main">
          <Link to="/" className="font-display text-lg font-semibold tracking-tight text-graphite-900">
            Premier<span className="text-amber-600">Power</span>
          </Link>

          {/* Nav items are points on the run. */}
          <ul className="ml-auto hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    `relative text-sm transition-colors duration-200 hover:text-graphite-900 ${
                      isActive ? 'text-graphite-900' : 'text-graphite-500'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      <span
                        aria-hidden="true"
                        className={`absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-graphite-700 transition-opacity duration-200 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto hidden lg:ml-0 lg:block">
            <Button to="/contact" size="sm">Free site assessment</Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="ml-auto rounded-lg p-2 text-graphite-800 transition-colors hover:bg-graphite-900/[0.06] lg:hidden"
          >
            <MenuIcon />
          </button>
        </nav>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  )
}

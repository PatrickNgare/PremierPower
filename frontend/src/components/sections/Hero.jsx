import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import Button from '@/components/ui/Button'
import Photo from '@/components/ui/Photo'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { heroSlides } from '@/data/heroSlides'
import { demoPhotos } from '@/config/demo'
import { whatsappLink } from '@/config/site'

const AUTOPLAY_MS = 6500

export default function Hero() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const wa = whatsappLink()
  const n = heroSlides.length
  const slide = heroSlides[i]

  const go = useCallback((d) => setI((p) => (p + d + n) % n), [n])

  useEffect(() => {
    // An auto-advancing carousel is motion. Under a reduced-motion preference
    // it stays put and the arrows remain the way through.
    if (paused || reduce || n < 2) return
    const t = setInterval(() => setI((p) => (p + 1) % n), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, reduce, n])

  return (
    <section
      className="relative overflow-hidden bg-neutral-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="What we do"
    >
      <div className="container-x grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="eyebrow">{slide.eyebrow}</span>
              <h1 className="mt-4 max-w-[16ch] text-[clamp(2.25rem,5.2vw,3.75rem)] font-bold leading-[1.02] text-primary">
                {slide.headline}
              </h1>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-neutral-600 sm:text-lg">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/contact" variant="primaryLg">Book a free site assessment</Button>
            {wa && (
              <Button href={wa} variant="outline" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp size={17} aria-hidden="true" /> Ask on WhatsApp
              </Button>
            )}
          </div>

          <LicenseBadge className="mt-7" />

          {n > 1 && (
            <div className="mt-9 flex items-center gap-4">
              <button type="button" onClick={() => go(-1)} aria-label="Previous slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-secondary-deep hover:text-secondary-deep">
                <FiChevronLeft size={17} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next slide"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-secondary-deep hover:text-secondary-deep">
                <FiChevronRight size={17} aria-hidden="true" />
              </button>
              <ul className="flex gap-2" role="tablist" aria-label="Slides">
                {heroSlides.map((s, idx) => (
                  <li key={s.headline} role="presentation">
                    <button type="button" role="tab" aria-selected={idx === i}
                      aria-label={`Slide ${idx + 1}: ${s.eyebrow}`} onClick={() => setI(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === i ? 'w-7 bg-secondary' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                      }`} />
                  </li>
                ))}
              </ul>
              <span className="ml-1 text-xs font-semibold tabular-nums text-neutral-400">
                {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Photo
                priority={i === 0}
                demoSrc={demoPhotos[slide.photoKey]}
                ratio={slide.ratio ?? '4 / 5'}
                sizes="(max-width: 1024px) 92vw, 44vw"
                brief={slide.brief}
                alt={slide.alt}
                className="w-full shadow-xl"
              />
            </motion.div>
          </AnimatePresence>
          {/* Brand rule anchoring the image, echoing the logo's bars. */}
          <div aria-hidden="true" className="absolute -bottom-3 -left-3 hidden h-24 w-1.5 rounded-full bg-secondary lg:block" />
        </div>
      </div>
    </section>
  )
}

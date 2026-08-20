import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Button from './Button'
import LicenseBadge from './LicenseBadge'
import Photo from './Photo'
import ChaseRoute from './ChaseRoute'
import { ChevronIcon } from './Icons'
import { whatsappLink } from '../config/site'
import { demoPhotos } from '../config/demo'
import { heroSlides } from '../data/heroSlides'

const INTERVAL = 6000

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Hero() {
  const wa = whatsappLink()
  const reduceMotion = useReducedMotion()

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent((i) => (i + 1) % heroSlides.length), [])
  const prev = useCallback(() => setCurrent((i) => (i - 1 + heroSlides.length) % heroSlides.length), [])

  useEffect(() => {
    if (paused || reduceMotion || heroSlides.length <= 1) return
    const id = setInterval(next, INTERVAL)
    return () => clearInterval(id)
  }, [paused, reduceMotion, next])

  const slide = heroSlides[current]

  return (
    <section
      className="paper relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* The chase enters here and drops toward the page. */}
      <ChaseRoute
        className="pointer-events-none absolute left-4 top-0 hidden h-full w-36 xl:block"
        viewBox="0 0 40 400"
        d="M20 0 V400"
        outlets={[{ x: 20, y: 232, at: 0.7 }]}
      />

      <div className="mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-500">
                {slide.eyebrow}
              </p>
              <h1 className="mt-3 max-w-[15ch] text-[clamp(2.5rem,6.2vw,4.25rem)] font-semibold leading-[0.98] text-ink-900">
                {slide.headline}
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-500">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            variants={rise} initial="hidden" animate="show" custom={2}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/contact" size="lg">Book a free site assessment</Button>
            {wa && (
              <Button href={wa} variant="outline" size="lg" target="_blank" rel="noopener noreferrer">
                Ask on WhatsApp
              </Button>
            )}
          </motion.div>

          <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-8">
            <LicenseBadge />
          </motion.div>
        </div>

        <div>
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5 }}
              >
                <Photo
                  priority={current === 0}
                  demoSrc={demoPhotos[slide.photoKey]}
                  ratio={slide.ratio}
                  className="w-full"
                  sizes="(max-width: 1024px) 92vw, 44vw"
                  brief={slide.brief}
                  alt={slide.alt}
                />
              </motion.div>
            </AnimatePresence>

            {heroSlides.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous slide"
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-paper-100/40 bg-ink-900/45 p-2 text-paper-50 backdrop-blur-sm transition-colors hover:bg-ink-900/70"
                >
                  <ChevronIcon width={18} height={18} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next slide"
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-paper-100/40 bg-ink-900/45 p-2 text-paper-50 backdrop-blur-sm transition-colors hover:bg-ink-900/70"
                >
                  <ChevronIcon width={18} height={18} className="rotate-180" />
                </button>

                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                  <span className="rounded-full border border-paper-100/30 bg-ink-900/45 px-2.5 py-1 font-mono text-[0.7rem] tabular-nums text-paper-50 backdrop-blur-sm">
                    {String(current + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
                  </span>
                </div>
              </>
            )}
          </div>

          {heroSlides.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-7 bg-red-600' : 'w-1.5 bg-ink-900/20 hover:bg-ink-900/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

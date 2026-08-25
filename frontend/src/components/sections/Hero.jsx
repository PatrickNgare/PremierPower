import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import Photo from '@/components/ui/Photo'
import LicenseBadge from '@/components/ui/LicenseBadge'
import { heroSlides } from '@/data/heroSlides'
import { demoPhotos } from '@/config/demo'

const INTERVAL = 5500

const pulseRing = {
  animate: { scale: [1, 1.6, 2.2], opacity: [0.55, 0.2, 0] },
  transition: { duration: 2.8, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.8 },
}

/**
 * Direction-aware slide between hero images.
 *
 * SpaceInfra animates clip-path here. That proved unreliable: the compositor
 * holds a stale clip while computed style reports it open, leaving the
 * photograph half-painted — a black hero, which is worse than any transition
 * is good. Transforms composite reliably, so the curtain is a translate
 * inside the section's overflow-hidden instead. Same directional read.
 */
const slideVariants = {
  enter: (dir) => ({ x: dir >= 0 ? '100%' : '-100%', zIndex: 1 }),
  center: { x: '0%', zIndex: 1, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } },
  // The outgoing slide holds its position and simply waits to be unmounted.
  // Moving it out leaves a black gap between the two while they cross, which
  // is exactly the failure the clip-path version did not have.
  exit: { x: '0%', zIndex: 0, transition: { duration: 0.9 } },
}

/** Per-character spring-up, used on the locality line. */
function CharSplit({ text, className, delayOffset = 0 }) {
  return (
    <span className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          aria-hidden
          variants={{
            hidden: { y: '110%', opacity: 0 },
            visible: {
              y: '0%', opacity: 1,
              transition: { duration: 0.5, delay: delayOffset + i * 0.028, ease: [0.34, 1.56, 0.64, 1] },
            },
          }}
          className="inline-block"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
    </span>
  )
}

/**
 * Framer Motion's tap gesture swallows Enter on a motion.button — Space
 * activates, Enter does nothing. Enter is the key most people reach for, so
 * every animated control here handles it explicitly.
 */
const activateOnEnter = (fn) => (e) => {
  if (e.key === 'Enter') { e.preventDefault(); fn() }
}

export default function Hero() {
  const slides = heroSlides
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const parallaxX = useSpring(rawX, { stiffness: 42, damping: 18 })
  const parallaxY = useSpring(rawY, { stiffness: 42, damping: 18 })

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((i) => (i + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((i) => (i - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    // An auto-advancing carousel is motion: it stays put under a reduced-motion
    // preference, and the arrows remain the way through.
    if (paused || reduce || slides.length <= 1) return
    const id = setInterval(next, INTERVAL)
    return () => clearInterval(id)
  }, [paused, reduce, next, slides.length])

  const handleMouseMove = (e) => {
    if (reduce) return
    const { clientX, clientY, currentTarget } = e
    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    rawX.set(((clientX - left) / width - 0.5) * 20)
    rawY.set(((clientY - top) / height - 0.5) * 12)
  }
  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
    setPaused(false)
  }

  const slide = slides[current]

  return (
    <section
      className="on-dark relative min-h-[100svh] overflow-hidden bg-primary-dark"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={handleMouseLeave}
      aria-roledescription="carousel"
      aria-label="Our work"
    >
      {/* initial={false}: the first slide mounts already open. Animating
          clip-path on mount leaves the layer partially composited under
          software rendering, which paints the hero black. Wipes still run on
          every subsequent slide change. */}
      <AnimatePresence mode="sync" custom={direction} initial={false}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
          style={{ transform: 'translateZ(0)' }}
        >
          <Photo
            priority
            demoSrc={demoPhotos[slide.photoKey]}
            alt=""
            brief={slide.brief}
            ratio="auto"
            kenBurns
            fill
            className="h-full w-full rounded-none"
          />
        </motion.div>
      </AnimatePresence>

      {/* Legibility gradients over the photograph. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[42%] bg-gradient-to-b from-black/65 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[52%] bg-gradient-to-t from-black/82 to-transparent" />
      {/* Left scrim. The top/bottom gradients leave a clear band across the
          middle, and a light photograph there makes white text vanish. This
          keeps the headline column legible over any image. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-gradient-to-r from-black/80 via-black/45 to-transparent md:w-[70%]" />
      <div aria-hidden="true" className="dot-overlay pointer-events-none absolute inset-0 z-[1] opacity-30" />

      {/* Headline block — mouse parallax. */}
      <motion.div
        className="absolute left-6 top-28 z-10 md:left-14"
        style={{ x: parallaxX, y: parallaxY }}
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
      >
        <motion.p
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/60 sm:text-sm"
        >
          Premier Power Limited · EPRA licensed
        </motion.p>

        <h1 className="font-heading font-bold leading-tight">
          {['Residential', 'wiring'].map((word, i) => (
            <Fragment key={word}>
              {i > 0 && ' '}
              <motion.span
                variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } } }}
                className="mr-2 inline-block text-2xl text-white sm:text-3xl md:text-4xl lg:text-5xl"
              >
                {word}
              </motion.span>
            </Fragment>
          ))}
          <br />
          <span className="inline-block overflow-hidden">
            <motion.span
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.028, delayChildren: 0.6 } } }}
              className="inline-block"
            >
              <CharSplit
                text="in Nairobi, Kenya"
                className="inline font-heading text-2xl font-bold text-secondary-accent sm:text-3xl md:text-4xl lg:text-5xl"
              />
            </motion.span>
          </span>
        </h1>

        <motion.div
          variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: { duration: 0.5, delay: 0.7 } } }}
          className="accent-rule mt-5"
        />

        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 1.1 } } }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <Link to="/contact" className="btn-primary-lg">Book a Free Site Assessment</Link>
          <Link to="/portfolio" className="btn-ghost">See Our Work</Link>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay: 1.3 } } }}
          className="mt-7"
        >
          <LicenseBadge tone="dark" />
        </motion.div>
      </motion.div>

      {/* Per-slide caption. */}
      <div className="absolute bottom-20 left-6 z-10 max-w-[70%] md:left-14 md:max-w-[55%]">
        <AnimatePresence mode="wait">
          <motion.div key={`caption-${current}`}>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="font-heading text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl md:text-3xl"
            >
              {slide.eyebrow}
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.45, delay: 0.48, ease: 'easeOut' }}
              className="accent-rule mt-2.5"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide counter. */}
      <div className="absolute bottom-8 left-6 z-20 hidden items-center gap-2 md:left-14 md:flex">
        <AnimatePresence mode="wait">
          <motion.span
            key={`counter-${current}`}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-block w-7 font-heading text-base font-bold tabular-nums text-white"
          >
            {String(current + 1).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
        <span className="mx-0.5 select-none text-xs text-white/55">/</span>
        <span className="select-none font-heading text-base tabular-nums text-white/60">
          {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      <motion.button
        onClick={prev} onKeyDown={activateOnEnter(prev)}
        whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm md:flex"
      >
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
          animate={pulseRing.animate} transition={pulseRing.transition} />
        <FaChevronLeft size={14} className="relative z-10" aria-hidden="true" />
      </motion.button>

      <motion.button
        onClick={next} onKeyDown={activateOnEnter(next)}
        whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm md:flex"
      >
        <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
          animate={pulseRing.animate} transition={{ ...pulseRing.transition, delay: 1.4 }} />
        <FaChevronRight size={14} className="relative z-10" aria-hidden="true" />
      </motion.button>

      {/* Dot indicators. */}
      <div role="tablist" aria-label="Slides"
        className="absolute bottom-8 right-6 z-20 flex items-center gap-2 md:right-14">
        {slides.map((s, i) => (
          <motion.button
            key={s.headline}
            role="tab"
            aria-selected={i === current}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
            onKeyDown={activateOnEnter(() => { setDirection(i > current ? 1 : -1); setCurrent(i) })}
            whileHover={{ scale: 1.4 }} whileTap={{ scale: 0.9 }}
            aria-label={`Go to slide ${i + 1}: ${s.eyebrow}`}
            animate={i === current ? { width: 32, height: 8 } : { width: 8, height: 8 }}
            transition={{ duration: 0.3 }}
            className={`rounded-full ${i === current ? 'bg-secondary' : 'bg-white/40 hover:bg-white/70'}`}
            style={i === current ? { boxShadow: '0 0 10px rgba(255,0,0,0.75)' } : {}}
          />
        ))}
      </div>

      {/* Autoplay progress. */}
      {!paused && !reduce && slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
          <motion.div
            key={current}
            className="h-full rounded-full bg-secondary"
            style={{ boxShadow: '0 0 8px rgba(255,0,0,0.7)' }}
            initial={{ width: '0%' }} animate={{ width: '100%' }}
            transition={{ duration: INTERVAL / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </section>
  )
}

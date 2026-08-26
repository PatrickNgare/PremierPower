import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, PhoneCall, ShieldCheck, MapPin, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { telLink } from '@/config/site'
import { heroSlides } from '@/data/heroSlides'
import { DUR, EASE_OUT, EASE_EXIT } from '@/utils/motion'

const AUTOPLAY_MS = 6500

/**
 * Framer's tap gesture swallows Enter on a motion.button — Space activates,
 * Enter does not. Enter is the key most people reach for, so it is handled
 * explicitly on every control here.
 */
const onEnter = (fn) => (e) => {
  if (e.key === 'Enter') { e.preventDefault(); fn() }
}

const EASE = [0.22, 1, 0.36, 1]

/** Direction-aware swap: springs in from the side, with a little rotation so
 *  it reads as a card being dealt rather than a fade. */
const cardSwap = {
  enter: (d) => ({ opacity: 0, x: d >= 0 ? 64 : -64, scale: 0.92, rotate: d >= 0 ? 3 : -3 }),
  center: {
    opacity: 1, x: 0, scale: 1, rotate: 0,
    transition: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 },
  },
  exit: (d) => ({
    opacity: 0, x: d >= 0 ? -48 : 48, scale: 0.96, rotate: d >= 0 ? -2 : 2,
    transition: { duration: 0.24, ease: EASE_EXIT },
  }),
}

const rise = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: EASE } },
}

const trust = [
  { icon: ShieldCheck, label: 'NCA registered' },
  { icon: MapPin, label: 'Projects nationwide' },
  { icon: Zap, label: 'Electrical · Lighting · Solar' },
]

export default function Hero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const [fine, setFine] = useState(false)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)
  const n = heroSlides.length
  const slide = heroSlides[i]

  const go = useCallback((d) => { setDir(d); setI((p) => (p + d + n) % n) }, [n])

  useEffect(() => {
    // An auto-advancing carousel is motion; under a reduced-motion preference
    // it holds still and the controls remain the way through.
    if (paused || reduce || n < 2) return
    const t = setInterval(() => { setDir(1); setI((p) => (p + 1) % n) }, AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, reduce, n])

  // Pointer position, normalised to -0.5..0.5 around the section centre.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 22, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 60, damping: 22, mass: 0.6 })

  // Light and image drift in opposite directions — the room reacts, gently.
  const glowX = useTransform(sx, (v) => `${50 + v * 46}%`)
  const glowY = useTransform(sy, (v) => `${42 + v * 34}%`)
  const imgX = useTransform(sx, (v) => v * -26)
  const imgY = useTransform(sy, (v) => v * -18)
  const cardX = useTransform(sx, (v) => v * 42)
  const cardY = useTransform(sy, (v) => v * 30)
  const tiltY = useTransform(sx, (v) => v * 14)
  const tiltX = useTransform(sy, (v) => v * -10)

  useEffect(() => {
    // Cursor lighting is a pointer affordance; it has no meaning on touch.
    const mq = window.matchMedia('(pointer: fine)')
    const apply = () => setFine(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!fine || reduce) return
    const el = sectionRef.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    const onLeave = () => { px.set(0); py.set(0) }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [fine, reduce, px, py])

  const tel = telLink()

  return (
    <section
      ref={sectionRef}
      className="on-dark relative isolate flex min-h-[min(100svh,46rem)] items-center overflow-hidden bg-ink-950"
      aria-label="Premier Power — electrical engineering and lighting"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* ── Layer 1: the room ─────────────────────────────────── */}
      <motion.div
        style={fine && !reduce ? { x: imgX, y: imgY } : undefined}
        className="absolute -inset-[3%] -z-30"
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={slide.image}
            src={slide.image}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.cinematic, ease: EASE_OUT }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </AnimatePresence>
      </motion.div>

      {/* ── Layer 2: architectural shadow, so text always reads ── */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/35" />
      <div aria-hidden="true" className="absolute inset-0 -z-20 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/70" />

      {/* ── Layer 3: the light itself, following the pointer ───── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: fine && !reduce
            ? undefined
            : 'radial-gradient(38rem 30rem at 62% 38%, rgb(245 201 123 / 0.22), transparent 62%)',
          ...(fine && !reduce
            ? {
                backgroundImage:
                  'radial-gradient(38rem 30rem at var(--gx) var(--gy), rgb(245 201 123 / 0.26), transparent 62%)',
                '--gx': glowX,
                '--gy': glowY,
              }
            : {}),
        }}
      />
      <div aria-hidden="true" className="light-beam animate-beam pointer-events-none absolute inset-0 -z-10 motion-reduce:animate-none" />

      {/* ── Content ───────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } }}
        className="container-x relative grid w-full items-center gap-10 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:py-20"
      >
        <div className="max-w-2xl">
          <motion.p variants={rise} className="eyebrow">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))]" />
            Premier Power Limited
          </motion.p>

          <motion.h1
            variants={rise}
            className="mt-5 text-[clamp(2.25rem,4.6vw,3.9rem)] font-extrabold text-white"
          >
            Powering spaces.
            <span className="mt-1 block bg-gradient-to-r from-lumen-300 via-lumen-500 to-lumen-700 bg-clip-text text-transparent">
              Illuminating possibilities.
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            Electrical engineering and lighting installation across Kenya — for hotels and
            lodges, commercial interiors, institutions, healthcare, industrial sites and
            residential developments.
          </motion.p>

          <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/services" className="btn-primary group">
              Explore our solutions
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            {tel ? (
              <a href={tel} className="btn-ghost group">
                <PhoneCall size={16} aria-hidden="true" />
                Talk to an expert
              </a>
            ) : (
              <Link to="/contact" className="btn-ghost">Talk to an expert</Link>
            )}
          </motion.div>

          {/* Caption for the current slide. Fixed min-height so the controls
              below do not shift as captions of different lengths cycle. */}
          <motion.div variants={rise} className="mt-8 min-h-[3.25rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.caption}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: DUR.control, ease: EASE_OUT }}
              >
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-lumen-500">
                  {slide.eyebrow}
                </p>
                <p className="mt-1.5 text-sm text-ink-300">
                  <span className="font-semibold text-white">{slide.caption}</span>
                  {' \u2014 '}{slide.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div variants={rise} className="mt-7 flex items-center gap-3">
            <button
              type="button" onClick={() => go(-1)} onKeyDown={onEnter(() => go(-1))}
              aria-label="Previous slide"
              className="group/nav flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-lumen-500 hover:bg-lumen-500/10 hover:text-lumen-500 active:scale-90"
            >
              <ChevronLeft size={18} className="transition-transform duration-300 group-hover/nav:-translate-x-0.5" aria-hidden="true" />
            </button>
            <button
              type="button" onClick={() => go(1)} onKeyDown={onEnter(() => go(1))}
              aria-label="Next slide"
              className="group/nav flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-lumen-500 hover:bg-lumen-500/10 hover:text-lumen-500 active:scale-90"
            >
              <ChevronRight size={18} className="transition-transform duration-300 group-hover/nav:translate-x-0.5" aria-hidden="true" />
            </button>
            <ul role="tablist" aria-label="Slides" className="ml-2 flex items-center gap-2">
              {heroSlides.map((sl, idx) => (
                <li key={sl.caption}>
                  <button
                    type="button" role="tab" aria-selected={idx === i}
                    aria-label={`Slide ${idx + 1}: ${sl.caption}`}
                    onClick={() => { setDir(idx > i ? 1 : -1); setI(idx) }}
                    onKeyDown={onEnter(() => { setDir(idx > i ? 1 : -1); setI(idx) })}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === i
                        ? 'w-9 bg-lumen-500 shadow-[0_0_14px_rgba(245,201,123,0.9)]'
                        : 'w-1.5 bg-white/30 hover:w-3 hover:bg-white/70'
                    }`}
                  />
                </li>
              ))}
            </ul>
            <span className="ml-1 tabular text-xs font-semibold text-ink-400">
              {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
          </motion.div>

          <motion.ul variants={rise} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-ink-300">
                <Icon size={16} className="text-lumen-500" aria-hidden="true" />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Floating specimen card — a fixture lit by the room behind it. */}
        <motion.div
          variants={rise}
          style={fine && !reduce ? { x: cardX, y: cardY } : undefined}
          className="relative mx-auto hidden w-full max-w-md lg:block xl:max-w-lg"
        >
          <motion.div
            style={fine && !reduce ? { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 } : undefined}
            className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.07] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
          >
            {/* Light catching the top edge, the way glass does. */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={slide.image}
                custom={dir}
                variants={cardSwap}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  loading="eager"
                  decoding="async"
                  className="h-64 w-full object-cover xl:h-80"
                />
                <div className="relative bg-ink-950/45 p-7 backdrop-blur-sm">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-lumen-500">
                    {slide.card.label}
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-white">
                    {slide.card.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    {slide.card.line}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-lumen-500/20 blur-3xl" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
        className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center lg:flex"
        aria-hidden="true"
      >
        <span className="flex h-11 w-7 items-start justify-center rounded-full border border-white/25 p-1.5">
          <motion.span
            animate={reduce ? {} : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
            className="block h-1.5 w-1.5 rounded-full bg-lumen-500"
          />
        </span>
      </motion.div>
    </section>
  )
}

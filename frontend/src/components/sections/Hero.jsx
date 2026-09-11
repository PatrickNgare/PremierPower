import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, PhoneCall, ShieldCheck, MapPin, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { telLink } from '@/config/site'
import { heroSlides } from '@/data/heroSlides'
import { useApi } from '@/hooks/useApi'
import { splitTitle } from '@/hooks/useSection'
import { DUR, EASE_OUT } from '@/utils/motion'
import { useSite } from '@/hooks/useSite'
import { cdnSrcSet, fallbackToLocal } from '@/utils/photo'

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

const rise = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: EASE } },
}

const trust = [
  { icon: ShieldCheck, label: 'NCA registered' },
  { icon: MapPin, label: 'Projects nationwide' },
  { icon: Zap, label: 'Electrical · Lighting · Solar' },
]

/** The CMS stores a slide flat; the composition wants it nested. */
const fromBanner = (b) => ({
  eyebrow: b.eyebrow,
  caption: b.headline,
  line: b.body,
  image: b.image_url,
  alt: b.image_alt,
})

/**
 * Full-bleed, one photograph at a time — the brief was "a full page hero,
 * like SpaceInfra's": a single image filling the section rather than a
 * two-column split with a floating specimen card beside the text. The card
 * is gone; the photograph itself is now the whole room, the way SpaceInfra's
 * is, with the headline read directly off it rather than off a panel
 * floating in front of it.
 *
 * `card_label` / `card_title` / `card_line` on the banner record fed that
 * panel and nothing else — they still exist in the CMS (Company details →
 * banners) and are safe to leave filled in, but nothing on the public site
 * reads them any more. Worth knowing before editing one expecting it to
 * change something visible.
 */
export default function Hero({ section }) {
  const site = useSite()
  // The hero's own words. The slides are separate — they are the banners table.
  const [line1, line2] = splitTitle(section?.title || 'Powering spaces.|Illuminating possibilities.')
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const [fine, setFine] = useState(false)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)

  // Slides come from the CMS. The bundled set is the fallback for a first
  // paint or an unreachable API — it is the same content, not a placeholder.
  const { data: banners } = useApi('/banners', null)
  const slides = useMemo(
    () => (Array.isArray(banners) && banners.length ? banners.map(fromBanner) : heroSlides),
    [banners],
  )

  const n = slides.length
  // The CMS can shorten the list while this is mounted; clamp so the index
  // cannot point past the end and blank the hero.
  const slide = slides[Math.min(i, n - 1)]

  const go = useCallback((d) => { setI((p) => (p + d + n) % n) }, [n])

  useEffect(() => {
    // An auto-advancing carousel is motion; under a reduced-motion preference
    // it holds still and the controls remain the way through.
    if (paused || reduce || n < 2) return
    const t = setInterval(() => setI((p) => (p + 1) % n), AUTOPLAY_MS)
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
  const imgX = useTransform(sx, (v) => v * -22)
  const imgY = useTransform(sy, (v) => v * -14)

  /**
   * Depth for touch.
   *
   * The pointer transforms above have no meaning on a phone, so scroll
   * progress is the equivalent input a touch device does have. Costs nothing
   * extra: the browser composites it off the main thread either way.
   */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const sp = useSpring(scrollYProgress, { stiffness: 60, damping: 22, mass: 0.6 })
  const scrollBgY = useTransform(sp, [0, 1], [0, -48])

  // Pointer depth stays the richer treatment where a pointer exists; scroll
  // depth fills in where one does not, so neither kind of visitor gets a flat
  // hero and neither pays for the other's version.
  const pointerDepth = fine && !reduce
  const scrollDepth = !fine && !reduce

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

  const tel = telLink(site)

  return (
    <section
      ref={sectionRef}
      className="on-dark relative isolate flex min-h-[min(100svh,46rem)] flex-col overflow-hidden bg-ink-950"
      aria-label="Premier Power — electrical engineering and lighting"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* ── Layer 1: the room, full-bleed ────────────────────────
          Close to full brightness now that nothing else is competing for
          attention — the scrim below does the legibility work, the way
          PageHero already does for every interior page, rather than the
          photograph itself being dimmed as a backdrop. */}
      <motion.div
        style={
          pointerDepth ? { x: imgX, y: imgY }
            : scrollDepth ? { y: scrollBgY }
            : undefined
        }
        className="absolute -inset-[3%] -z-30"
      >
        <AnimatePresence initial={false}>
          <motion.img onError={fallbackToLocal}
            key={slide.image}
            src={slide.image}
            srcSet={cdnSrcSet(slide.image, [640, 960, 1280, 1600, 1920, 2560])}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.94 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.cinematic, ease: EASE_OUT }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </AnimatePresence>
      </motion.div>

      {/* ── Layer 2: architectural shadow, so text always reads ──
          Written as literal rgb() stops, not Tailwind's from-/via-/to-
          utilities: Tailwind v4 interpolates those in OKLab by default
          (--tw-gradient-position: to right in oklab), which front-loads the
          darkening — measured at 10/255 average brightness through a region
          the same stops predict roughly 195/255 for under plain linear alpha
          blending, on a photograph that is 109/255 unfiltered. A plain
          CSS linear-gradient() interpolates in sRGB, which is what the rest
          of this file's own gradients (the ambient glow below) already rely
          on for a predictable result. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20" style={{ background: 'linear-gradient(90deg, rgb(8 8 10 / 0.94) 0%, rgb(8 8 10 / 0.55) 42%, rgb(8 8 10 / 0.08) 78%)' }} />
      <div aria-hidden="true" className="absolute inset-0 -z-20" style={{ background: 'linear-gradient(0deg, rgb(8 8 10 / 0.6) 0%, rgb(8 8 10 / 0.04) 32%, rgb(8 8 10 / 0.28) 100%)' }} />

      {/* ── Layer 3: the light itself, following the pointer ───── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: fine && !reduce
            ? undefined
            : 'radial-gradient(38rem 30rem at 62% 38%, rgb(245 201 123 / 0.2), transparent 62%)',
          ...(fine && !reduce
            ? {
                backgroundImage:
                  'radial-gradient(38rem 30rem at var(--gx) var(--gy), rgb(245 201 123 / 0.24), transparent 62%)',
                '--gx': glowX,
                '--gy': glowY,
              }
            : {}),
        }}
      />
      <div aria-hidden="true" className="light-beam animate-beam pointer-events-none absolute inset-0 -z-10 motion-reduce:animate-none" />
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10" />

      {/* ── Content — one column, read directly off the photograph ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } }}
        className="container-x relative flex flex-1 flex-col justify-center py-16 lg:py-20"
      >
        <div className="max-w-2xl">
          <motion.p variants={rise} className="eyebrow">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))]" />
            {section?.eyebrow || 'Premier Power Limited'}
          </motion.p>

          <motion.h1
            variants={rise}
            className="mt-5 text-[clamp(2.5rem,5.4vw,4.6rem)] font-extrabold text-white"
          >
            {line1}
            {line2 && (
              // A warm white, not a gold. The saturated gradient made this line
              // outrank the one above it, so "Illuminating possibilities" read
              // as the business and "Powering spaces" as the subtitle — which
              // is backwards for a contractor pitching every sector. The two
              // lines now carry equal weight and the warmth is a tint, not a
              // second brand colour competing with the red.
              <span className="mt-1 block bg-gradient-to-r from-lumen-100 via-lumen-300 to-lumen-500 bg-clip-text text-transparent">
                {line2}
              </span>
            )}
          </motion.h1>

          <motion.p variants={rise} className="mt-5 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
            {section?.subtitle || `Electrical engineering and lighting installation across
              Kenya — for hotels and lodges, commercial interiors, institutions, healthcare,
              industrial sites and residential developments.`}
          </motion.p>

          <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={section?.cta_href || '/services'} className="btn-primary group">
              {section?.cta_label || 'Explore our solutions'}
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-1.5 group-active:duration-150" aria-hidden="true" />
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

          <motion.ul variants={rise} className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-ink-300">
                <Icon size={16} className="text-lumen-500" aria-hidden="true" />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>

      {/* ── The current slide, and the controls for it — its own row,
             anchored to the foot of the photograph rather than stacked under
             the headline. This is the one thing a full-bleed hero still
             needs that a static banner does not: a way to know there is more
             than one room, and to move between them. ── */}
      <motion.div
        variants={rise} initial="hidden" animate="show"
        transition={{ delay: 0.3 }}
        className="container-x relative border-t border-white/10 py-5 sm:py-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          {/* Fixed min-height so the controls do not shift as captions of
              different lengths cycle. */}
          <div className="min-h-[2.75rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.caption}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DUR.control, ease: EASE_OUT }}
              >
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-lumen-500">
                  {slide.eyebrow}
                </p>
                <p className="mt-1 text-sm text-ink-300">
                  <span className="font-semibold text-white">{slide.caption}</span>
                  {slide.line && <>{' — '}{slide.line}</>}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-3">
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
              {slides.map((sl, idx) => (
                <li key={sl.caption}>
                  <button
                    type="button" role="tab" aria-selected={idx === i}
                    aria-label={`Slide ${idx + 1}: ${sl.caption}`}
                    onClick={() => setI(idx)}
                    onKeyDown={onEnter(() => setI(idx))}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === i
                        ? 'w-9 bg-lumen-500 shadow-[0_0_14px_rgba(245,201,123,0.9)]'
                        : 'w-1.5 bg-white/30 hover:w-3 hover:bg-white/70'
                    }`}
                  />
                </li>
              ))}
            </ul>
            <span className="ml-1 tabular text-xs font-semibold text-muted">
              {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

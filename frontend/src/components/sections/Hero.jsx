import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
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

/**
 * One side control. Vertically centred on the photograph rather than stacked
 * under it, so moving between rooms happens on the image itself.
 *
 * Hidden below `md` by its container: the headline is left-aligned to the
 * container edge, so a left-hand arrow would sit on the first characters of
 * the H1 at narrow widths. Touch gets the swipe below instead, which is the
 * gesture a phone user reaches for first anyway.
 */
function HeroNav({ back, label, onClick }) {
  const Icon = back ? ChevronLeft : ChevronRight
  return (
    <button
      type="button" onClick={onClick} onKeyDown={onEnter(onClick)}
      aria-label={label}
      className="group/nav pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-ink-950/45 text-white transition-all duration-300 hover:scale-110 hover:border-lumen-500 hover:bg-lumen-500 hover:text-ink-950 hover:shadow-[0_0_34px_rgba(245,201,123,0.45)] active:scale-95"
    >
      <Icon
        size={20}
        className={`transition-transform duration-300 ${back ? 'group-hover/nav:-translate-x-0.5' : 'group-hover/nav:translate-x-0.5'}`}
        aria-hidden="true"
      />
    </button>
  )
}

/**
 * How many rooms there are, which one this is, and how long it has left.
 *
 * The active marker's fill is also the carousel's clock: `onCycleEnd` is what
 * advances the slide, rather than a timer running alongside it. See the
 * autoplay note in Hero for why there is no second clock.
 */
function SlideMarkers({ slides, i, n, onJump, reduce, paused, onCycleEnd, className = '' }) {
  return (
    <div className={`items-center gap-4 ${className}`}>
      <ul role="tablist" aria-label="Slides" className="flex items-center gap-2">
        {slides.map((sl, idx) => (
          <li key={sl.caption}>
            <button
              type="button" role="tab" aria-selected={idx === i}
              aria-label={`Slide ${idx + 1}: ${sl.caption}`}
              onClick={() => onJump(idx)}
              onKeyDown={onEnter(() => onJump(idx))}
              className={`block h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
                idx === i ? 'w-12 bg-white/25' : 'w-1.5 bg-white/30 hover:w-4 hover:bg-white/70'
              }`}
            >
              {idx === i && (
                <span
                  aria-hidden="true"
                  onAnimationEnd={onCycleEnd}
                  className="block h-full w-full origin-left rounded-full bg-lumen-500 shadow-[0_0_14px_rgba(245,201,123,0.9)]"
                  style={
                    // No animation under a reduced-motion preference or with a
                    // single slide: the marker simply sits full, which is the
                    // same end state the fill reaches.
                    reduce || n < 2
                      ? undefined
                      : {
                          animation: `heroProgress ${AUTOPLAY_MS}ms linear forwards`,
                          animationPlayState: paused ? 'paused' : 'running',
                        }
                  }
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      <span className="tabular text-xs font-semibold text-muted">
        {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
      </span>
    </div>
  )
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
  // Which way the carousel is travelling, so a slide can enter from the side
  // it was asked for rather than every change looking identical.
  const [dir, setDir] = useState(1)
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

  const go = useCallback((d) => { setDir(d); setI((p) => (p + d + n) % n) }, [n])
  const jump = useCallback((idx) => { setDir(idx > i ? 1 : -1); setI(idx) }, [i])

  /**
   * Swipe, for the widths where the side arrows cannot fit.
   *
   * Native touch events on the section rather than a drag layer over it: an
   * overlay wide enough to catch a swipe anywhere on the photograph would
   * also sit on top of the two calls to action, and swallowing a tap on
   * "Explore our solutions" to gain a gesture is a bad trade. These bubble
   * up from whatever was touched, so the whole hero is swipeable and every
   * button underneath still works.
   */
  const touch = useRef(null)
  // Locked on the first few pixels of a drag and held for its lifetime, so a
  // gesture that starts as a scroll cannot turn into a swipe halfway down.
  const axis = useRef(null)
  const dragX = useMotionValue(0)

  const onTouchStart = (e) => {
    const t = e.changedTouches[0]
    touch.current = { x: t.clientX, y: t.clientY }
    axis.current = null
  }
  const onTouchMove = (e) => {
    const start = touch.current
    if (!start || n < 2 || reduce) return
    const t = e.touches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (!axis.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    // Half rate. The photograph following the finger exactly feels like it has
    // come loose; at half it reads as weight, and a long drag still cannot
    // pull the image off its own section.
    if (axis.current === 'x') dragX.set(dx * 0.5)
  }
  const onTouchEnd = (e) => {
    const start = touch.current
    touch.current = null
    const locked = axis.current
    axis.current = null
    if (!start || n < 2) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Horizontal intent only — a mostly-vertical drag is the page being
    // scrolled, and stealing that would make the hero feel broken.
    if (locked !== 'y' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    // Springs home whether or not it advanced: released short of the
    // threshold, the photograph falls back and says the swipe did not take.
    animate(dragX, 0, { type: 'spring', stiffness: 320, damping: 34, mass: 0.6 })
  }

  /*
   * Autoplay is driven by the slide marker's own fill animation finishing
   * (see onAnimationEnd below), not by a timer running alongside it.
   *
   * With both, the two clocks drift apart the moment the hero is hovered:
   * animation-play-state freezes the bar where it stands, while the interval
   * restarts from zero on resume, so the bar would reach full and then sit
   * there for several seconds waiting for a timer it no longer agrees with.
   * One clock cannot disagree with itself. It also means a reduced-motion
   * visitor gets no autoplay for free — no animation, no advance — which is
   * the behaviour we wanted anyway.
   */

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

  /**
   * How a photograph arrives and leaves.
   *
   * It enters from the side it was asked for and keeps settling for as long
   * as it is shown — the scale runs the full slide, not just the handover, so
   * the room is always drifting very slightly closer rather than freezing the
   * moment the crossfade ends. The -inset-[3%] on the wrapper is the margin
   * that lets it translate without exposing an edge.
   */
  const frames = useMemo(
    () =>
      reduce
        ? {
            enter: { opacity: 0 },
            settled: { opacity: 0.94, transition: { duration: DUR.control } },
            leave: { opacity: 0, transition: { duration: DUR.control } },
          }
        : {
            enter: (d) => ({ opacity: 0, x: d > 0 ? '5%' : '-5%', scale: 1.07 }),
            settled: {
              opacity: 0.94, x: '0%', scale: 1,
              transition: {
                opacity: { duration: DUR.cinematic, ease: EASE_OUT },
                x: { duration: DUR.cinematic, ease: EASE_OUT },
                scale: { duration: AUTOPLAY_MS / 1000, ease: 'linear' },
              },
            },
            leave: (d) => ({
              opacity: 0, x: d > 0 ? '-4%' : '4%',
              transition: { duration: DUR.cinematic * 0.9, ease: EASE_OUT },
            }),
          },
    [reduce],
  )

  /** The caption travels with the photograph it belongs to. */
  const captionFrames = useMemo(
    () =>
      reduce
        ? {
            enter: { opacity: 0 },
            settled: { opacity: 1, transition: { duration: DUR.control } },
            leave: { opacity: 0, transition: { duration: DUR.interaction } },
          }
        : {
            enter: (d) => ({ opacity: 0, x: d > 0 ? 20 : -20 }),
            settled: { opacity: 1, x: 0, transition: { duration: DUR.control, ease: EASE_OUT } },
            leave: (d) => ({
              opacity: 0, x: d > 0 ? -16 : 16,
              transition: { duration: DUR.interaction, ease: EASE_OUT },
            }),
          },
    [reduce],
  )

  const tel = telLink(site)

  return (
    <section
      ref={sectionRef}
      className="on-dark relative isolate flex min-h-[min(100svh_-_5.25rem,46rem)] flex-col overflow-hidden bg-ink-950"
      aria-label="Premier Power — electrical engineering and lighting"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={(e) => {
        if (n < 2) return
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
        else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      }}
    >
      {/* ── Layer 1: the room, full-bleed ────────────────────────
          Close to full brightness now that nothing else is competing for
          attention — the scrim below does the legibility work, the way
          PageHero already does for every interior page, rather than the
          photograph itself being dimmed as a backdrop. */}
      <motion.div
        style={
          pointerDepth ? { x: imgX, y: imgY }
            : scrollDepth ? { x: dragX, y: scrollBgY }
            : undefined
        }
        className="absolute -inset-[3%] -z-30"
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.img onError={fallbackToLocal}
            key={slide.image}
            custom={dir}
            src={slide.image}
            srcSet={cdnSrcSet(slide.image, [640, 960, 1280, 1600, 1920, 2560])}
            sizes="100vw"
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            decoding="async"
            variants={frames}
            initial="enter"
            animate="settled"
            exit="leave"
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

      {/* ── The way between rooms, on the sides of the photograph ──
             Anchored to the same 88rem box the content sits in, not to the
             viewport, so on a wide screen the arrows stay with the
             composition instead of drifting off to the far edges of the
             glass. The content's md:px-20 lane is what they sit in — that
             padding exists for these. */}
      {n > 1 && (
        <div className="pointer-events-none absolute inset-0 z-10 mx-auto hidden w-full max-w-[88rem] items-center justify-between px-2 md:flex lg:px-3">
          <HeroNav back label="Previous slide" onClick={() => go(-1)} />
          <HeroNav label="Next slide" onClick={() => go(1)} />
        </div>
      )}

      {/* ── Content — one column, read directly off the photograph ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } }}
        className="container-x relative flex flex-1 flex-col justify-center py-16 md:px-20 lg:py-20"
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

          {/* In the content column rather than down in the caption strip,
              because that strip falls below the fold on a 1366x768 laptop and
              behind the fixed call bar on a phone — which left the indicator
              invisible at the two most common sizes the site is viewed at.
              On a phone it is also the only affordance there is, since the
              side arrows cannot be shown at a width where the left one would
              land on the headline; swipe is the gesture there. */}
          {n > 1 && (
            <motion.div variants={rise} className="mt-9">
              <SlideMarkers
                slides={slides} i={i} n={n} onJump={jump}
                reduce={reduce} paused={paused} onCycleEnd={() => go(1)}
                className="flex"
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Which room this is. Caption only now: the way between rooms
             moved out to the sides of the photograph and up into the content
             column, leaving this row to name what is being looked at. ── */}
      <motion.div
        variants={rise} initial="hidden" animate="show"
        transition={{ delay: 0.3 }}
        className="container-x relative border-t border-white/10 py-5 sm:py-6 md:px-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-5">
          {/* Fixed min-height so the row does not resize as captions of
              different lengths cycle through it. */}
          <div className="min-h-[2.75rem]">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={slide.caption}
                custom={dir}
                variants={captionFrames}
                initial="enter"
                animate="settled"
                exit="leave"
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

        </div>
      </motion.div>
    </section>
  )
}

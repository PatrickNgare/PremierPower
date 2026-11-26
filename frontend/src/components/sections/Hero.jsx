import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, PhoneCall, ShieldCheck, MapPin, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { telLink } from '@/config/site'
import { heroSlides } from '@/data/heroSlides'
import { useApi } from '@/hooks/useApi'
import { splitTitle } from '@/hooks/useSection'
import { DUR, EASE_EXIT, EASE_OUT } from '@/utils/motion'
import { useSite } from '@/hooks/useSite'
import { cdnSrcSet, fallbackToLocal } from '@/utils/photo'

// Twelve seconds a photograph, at the client's request: long enough to read the
// headline and look at the room, short enough that a visitor still sees
// several rooms. The slide marker's fill runs on this same value.
const AUTOPLAY_MS = 12000

// The photograph's responsive widths. Shared by the <img> and the preloader
// below: the same srcset and sizes make the browser pick the same file, so the
// preloaded copy is the one the slide actually asks for.
const HERO_WIDTHS = [640, 960, 1280, 1600, 1920, 2560]

/*
 * The wipe between photographs: SpaceInfra's timing and curve, measured off its
 * live hero (1% across at 120ms, 7% at 300ms, half at 525ms, 93% at 750ms).
 * A slow start, a fast middle and a soft landing is what makes the edge feel
 * like a curtain being drawn rather than a slide sliding.
 */
const WIPE = { duration: 1.05, ease: [0.76, 0, 0.24, 1] }
// hero-wipe-* and hero-edge-* in index.css run on these same numbers.

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

/**
 * The word that completes "Illuminating …" for each slide.
 *
 * Keyed by the slide's category, not its position, so a reordered or edited
 * CMS list still pairs each photograph with its own word. A category with no
 * entry falls back to the CMS headline's own last word ("possibilities."), so
 * a new slide never shows a blank or a word meant for another photograph.
 */
const ACCENTS = {
  hospitality: 'lodges.',
  'commercial interiors': 'interiors.',
  installation: 'every circuit.',
  residential: 'homes.',
}
const accentFor = (slide) => ACCENTS[String(slide?.eyebrow || '').trim().toLowerCase()]

/*
 * The warm gradient ink, with a band of light parked off to the left of it.
 * Animating the first layer's position runs the band across the words once.
 * no-repeat is load-bearing: without it a 250%-wide layer tiles the band back
 * into view while it is supposed to be resting.
 */
const INK = {
  backgroundImage:
    'linear-gradient(100deg, transparent 42%, rgb(255 255 255 / 0.95) 50%, transparent 58%), linear-gradient(90deg, #FFF8EA 0%, #FFE6B8 50%, #F5C97B 100%)',
  backgroundSize: '250% 100%, 100% 100%',
  backgroundPosition: '160% 0, 0 0',
  backgroundRepeat: 'no-repeat',
}

/*
 * One pass of current: the band crosses the line and the words glow as it
 * does. The glow is what actually reads: over letters that are already a warm
 * white the band alone lifted them by at most 35/255, so it is carried by two
 * shadows, a tight warm core and a wide soft halo.
 */
const GLOW_OFF = 'drop-shadow(0 0 0 rgb(255 236 200 / 0)) drop-shadow(0 0 0 rgb(245 201 123 / 0))'
const SWEEP = [
  { backgroundPosition: '160% 0, 0 0', filter: GLOW_OFF },
  { filter: 'drop-shadow(0 0 5px rgb(255 236 200 / 0.55)) drop-shadow(0 0 22px rgb(245 201 123 / 0.7))', offset: 0.5 },
  { backgroundPosition: '-60% 0, 0 0', filter: GLOW_OFF },
]
const sweepTiming = (first) => ({
  duration: 1150,
  // After the masks come off (see MaskLine): once the lines have risen on
  // load, and once the new word has landed on a change. Land, then light up.
  delay: first ? 1500 : 700,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
})

/**
 * One line of the headline behind its own mask, so it rises into view rather
 * than fading. The padding, cancelled by an equal negative margin, is room for
 * descenders: h1 sits at 1.04 leading, tight enough that the mask would
 * otherwise shave the tails off the g and p in "Powering spaces".
 *
 * `clip` is only on while something is actually moving. A permanent mask also
 * crops the light pass's glow, which showed as a faint lit rectangle behind
 * each line with hard edges where the mask cut it off.
 */
function MaskLine({ variants, clip = true, className = '', children }) {
  return (
    <span className={`-mb-[0.2em] block pb-[0.2em] ${clip ? 'overflow-hidden' : 'overflow-visible'} ${className}`}>
      <motion.span variants={variants} className="relative block">
        {children}
      </motion.span>
    </span>
  )
}

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
  // "Illuminating possibilities." splits into the lead that stays and the last
  // word the slides replace. A one-word second line has nothing to rotate and
  // renders as written.
  const [lead, resting] = useMemo(() => {
    const t = (line2 || '').trim()
    const k = t.lastIndexOf(' ')
    return k > 0 ? [t.slice(0, k), t.slice(k + 1)] : [t, null]
  }, [line2])
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const [fine, setFine] = useState(false)
  const [i, setI] = useState(0)
  // Which way the carousel is travelling, so a slide can enter from the side
  // it was asked for rather than every change looking identical.
  const [dir, setDir] = useState(1)
  const [paused, setPaused] = useState(false)
  // True while the headline's words are moving and need their masks.
  const [masked, setMasked] = useState(true)
  // Counts slide changes. Keys the lit wipe edge, and keeps it off first paint.
  const [changes, setChanges] = useState(0)

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
  const word = accentFor(slide) || resting
  const clip = masked && !reduce

  // The masks go on in the same render as the change. Switching them on from
  // an effect would leave one painted frame with the incoming word unmasked,
  // sitting below its line on top of the lede.
  /*
   * Fetch the photographs either side of this one while it is showing.
   * Without this the wipe began before the incoming photograph had arrived:
   * on a slow connection the curtain drew an empty dark room across the
   * screen and the photograph popped in a second or two later. Twelve
   * seconds is ample time to fetch one image ahead in either direction.
   */
  useEffect(() => {
    if (n < 2) return
    for (const k of new Set([(i + 1) % n, (i - 1 + n) % n])) {
      const src = slides[k]?.image
      if (!src) continue
      const img = new Image()
      // sizes and srcset before src, or the browser starts on the fallback
      // file and then fetches the responsive one as well.
      img.sizes = '100vw'
      const set = cdnSrcSet(src, HERO_WIDTHS)
      if (set) img.srcset = set
      img.src = src
    }
  }, [i, n, slides])

  const go = useCallback((d) => {
    if (n < 2) return
    setMasked(true); setChanges((c) => c + 1); setDir(d); setI((p) => (p + d + n) % n)
  }, [n])
  const jump = useCallback((idx) => {
    if (idx === i) return
    setMasked(true); setChanges((c) => c + 1); setDir(idx > i ? 1 : -1); setI(idx)
  }, [i])

  /*
   * The light pass. The rotating word remounts on every change, so it starts
   * its pass from a callback ref as it mounts; the lead ("Illuminating") never
   * remounts, so an effect on the slide index starts its pass in step. Same
   * timing on both is what makes them read as one band crossing both lines.
   * Web Animations rather than a CSS class, so re-running it needs no class
   * toggling and no forced reflow.
   */
  const leadRef = useRef(null)
  const booted = useRef(false)
  const sweep = useCallback((el) => {
    if (el && !reduce) el.animate(SWEEP, sweepTiming(!booted.current))
  }, [reduce])
  useEffect(() => {
    const first = !booted.current
    booted.current = true
    if (!reduce && leadRef.current) leadRef.current.animate(SWEEP, sweepTiming(first))
    // Off once the reveal (load) or the word change (0.8s, visibly landed well
    // before) is done; the pass is timed to start just after.
    const t = setTimeout(() => setMasked(false), first ? 1500 : 700)
    return () => clearTimeout(t)
  }, [i, reduce])

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
   * How a photograph arrives: a curtain wiped in from the side it was asked
   * for, the way SpaceInfra's hero does it. One deliberate difference: its old
   * photograph fades out in 120ms, so the edge sweeps across a blank page for
   * most of the second. Here the outgoing photograph stays underneath until
   * the wipe has crossed, so one room is drawn over another. The incoming
   * layer takes the higher z-index outright instead of trusting DOM order.
   */
  const wipeFrames = useMemo(
    () =>
      reduce
        ? {
            enter: { opacity: 0, zIndex: 1 },
            settled: { opacity: 1, zIndex: 1, transition: { duration: DUR.control } },
            leave: { opacity: 0, zIndex: 0, transition: { duration: DUR.control } },
          }
        : {
            // The curtain itself is a CSS animation on the layer (hero-wipe-*),
            // not a variant; see the note above the photograph layer.
            enter: { zIndex: 1 },
            settled: { zIndex: 1 },
            leave: { zIndex: 0, opacity: 0, transition: { opacity: { delay: WIPE.duration, duration: 0.2 } } },
          },
    [reduce],
  )

  // One depth transform for the photograph and for the edge of light riding
  // its wipe, so the two stay aligned whatever the pointer or finger is doing.
  const depthStyle = pointerDepth ? { x: imgX, y: imgY }
    : scrollDepth ? { x: dragX, y: scrollBgY }
    : undefined

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

  /**
   * The rotating word, inside its mask: the new word rises in from the side of
   * travel while the old one leaves through the other, so "next" reads as the
   * words scrolling up and "previous" as them scrolling back down.
   */
  const wordFrames = useMemo(
    () =>
      reduce
        ? {
            enter: { opacity: 0 },
            settled: { opacity: 1, transition: { duration: DUR.control } },
            leave: { opacity: 0, transition: { duration: DUR.interaction } },
          }
        : {
            enter: (d) => ({ y: d > 0 ? '110%' : '-110%' }),
            settled: { y: '0%', transition: { duration: 0.8, ease: EASE_OUT } },
            leave: (d) => ({ y: d > 0 ? '-110%' : '110%', transition: { duration: 0.5, ease: EASE_EXIT } }),
          },
    [reduce],
  )

  /** On load each line of the headline rises from behind its mask, in turn. */
  const lineReveal = useMemo(
    () =>
      reduce
        ? { hidden: { y: '0%' }, show: { y: '0%' } }
        : { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.95, ease: EASE_OUT } } },
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
      {/* The curtain is a CSS animation started by the incoming layer
          mounting, in the same render as the lit edge, so the browser gives
          both the same start time and they stay locked at any frame rate.
          Driven by Framer, it started a frame or more after the edge whenever
          the main thread was busy, and at a few frames a second the two came
          apart across the width of the screen. Never on first paint. */}
      <motion.div style={depthStyle} className="absolute -inset-[3%] -z-30">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={slide.image}
            custom={dir}
            variants={wipeFrames}
            initial="enter"
            animate="settled"
            exit="leave"
            className={`absolute inset-0 overflow-hidden ${!reduce && changes > 0 ? (dir > 0 ? 'hero-wipe-next' : 'hero-wipe-prev') : ''}`}
          >
            {/* The room drifts closer for as long as it is shown and starts
                again with each photograph (hero-drift in index.css), so it is
                never a still frame between changes. */}
            <img onError={fallbackToLocal}
              src={slide.image}
              srcSet={cdnSrcSet(slide.image, HERO_WIDTHS)}
              sizes="100vw"
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              decoding="async"
              className="hero-drift h-full w-full object-cover object-center opacity-[0.94]"
            />
          </motion.div>
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

      {/* ── The edge of the wipe, lit ──
          A filament of warm light rides the curtain's edge across the room,
          the one part of the change that says electrical rather than
          slideshow. Above the scrims so it still reads over the dark side;
          in the photograph's own box and depth transform so it stays on the
          edge; same duration and curve as the wipe, and on the same clock
          (hero-edge-* in index.css, not a JS tween, which fell behind the
          curtain whenever the main thread was busy); only on a change. */}
      {!reduce && changes > 0 && (
        <motion.div aria-hidden="true" style={depthStyle} className="pointer-events-none absolute -inset-[3%] -z-10">
          <div key={`edge-${changes}`} className={`absolute inset-0 ${dir > 0 ? 'hero-edge-next' : 'hero-edge-prev'}`}>
            <span className="hero-edge-line absolute inset-y-0 left-0 w-[2px] -translate-x-1/2 bg-[#FFE6B8] shadow-[0_0_16px_3px_rgba(245,201,123,0.8),0_0_56px_14px_rgba(245,201,123,0.32)]" />
          </div>
        </motion.div>
      )}

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
             Anchored to the same box the content sits in. That box now spans
             the whole screen on anything short of ultrawide, so the arrows sit
             out near the edges of the photograph; only past that do they stay
             with the composition rather than drifting to the far edges of the
             glass. The content's md: lane is what they sit in. */}
      {n > 1 && (
        <div className="pointer-events-none absolute inset-0 z-10 mx-auto hidden w-full max-w-[120rem] items-center justify-between px-2 md:flex lg:px-3">
          <HeroNav back label="Previous slide" onClick={() => go(-1)} />
          <HeroNav label="Next slide" onClick={() => go(1)} />
        </div>
      )}

      {/* ── Content — one column, read directly off the photograph ── */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } } }}
        className="container-x relative flex flex-1 flex-col justify-center py-16 md:px-[max(5rem,4vw)] lg:py-20"
      >
        <div className="max-w-2xl">
          {/* The page's one H1 carries both the small label and the brand
              line, so what the company does ("electrical engineering … in
              Kenya") is part of the main heading rather than only the
              slogan. Visually unchanged: the label still reads as the small
              line above, the slogan as the large one. */}
          <motion.h1 variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
          <motion.span variants={rise} className="eyebrow font-sans leading-normal">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))]" />
            {section?.eyebrow || 'Electrical engineering & power solutions in Kenya'}
            <span className="sr-only"> — </span>
          </motion.span>

          <motion.span
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.11 } } }}
            className="mt-5 block text-[clamp(2.5rem,5.4vw,4.6rem)] font-extrabold leading-[1.05] text-white"
          >
            {/* One stable sentence for search engines and screen readers: the
                brand line exactly as the CMS holds it. Everything that moves is
                hidden from assistive technology, so a rotating word is never
                read out halfway through a sentence. */}
            <span className="sr-only">{[line1, line2].filter(Boolean).join(' ')}</span>
            <span aria-hidden="true" className="block">
              <MaskLine variants={lineReveal} clip={clip}>{line1}</MaskLine>
              {/* The second line is a warm white, not a gold: a saturated gold
                  made it outrank "Powering spaces", which is backwards for a
                  contractor pitching every sector. Literal colours in INK, not
                  lumen-* tokens, because dark mode remaps lumen-100 to a dark
                  brown and this sits on a photograph that is dark in both. */}
              {line2 && (resting ? (
                <>
                  <MaskLine variants={lineReveal} clip={clip} className="mt-1">
                    <span ref={leadRef} className="-mb-[0.2em] block bg-clip-text pb-[0.2em] text-transparent" style={INK}>
                      {lead}
                    </span>
                  </MaskLine>
                  {/* The word each photograph completes the line with. The
                      invisible copy holds the line's height, so a short word
                      and a long one never move the lede underneath. */}
                  <MaskLine variants={lineReveal} clip={clip}>
                    <span className="invisible block whitespace-nowrap">{word}</span>
                    <AnimatePresence initial={false} custom={dir}>
                      <motion.span
                        key={word}
                        ref={sweep}
                        custom={dir}
                        variants={wordFrames}
                        initial="enter"
                        animate="settled"
                        exit="leave"
                        className="absolute inset-x-0 top-0 block whitespace-nowrap bg-clip-text pb-[0.2em] text-transparent"
                        style={INK}
                      >
                        {word}
                      </motion.span>
                    </AnimatePresence>
                  </MaskLine>
                </>
              ) : (
                <MaskLine variants={lineReveal} clip={clip} className="mt-1">
                  <span className="-mb-[0.2em] block bg-clip-text pb-[0.2em] text-transparent" style={INK}>{line2}</span>
                </MaskLine>
              ))}
            </span>
          </motion.span>
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
            <motion.div variants={rise} className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 sm:flex-nowrap">
              <SlideMarkers
                slides={slides} i={i} n={n} onJump={jump}
                reduce={reduce} paused={paused} onCycleEnd={() => go(1)}
                className="flex shrink-0"
              />
              {/* Which project this is, next to the control that moves between
                  them and in view at every size. Its own line on a phone and
                  one truncated line from sm up: letting it wrap by length would
                  make the row change height as names of different lengths
                  cycle through. */}
              <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  <motion.p
                    key={slide.caption}
                    custom={dir}
                    variants={captionFrames}
                    initial="enter"
                    animate="settled"
                    exit="leave"
                    className="truncate text-sm text-ink-300"
                  >
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-lumen-500">{slide.eyebrow}</span>
                    <span aria-hidden="true" className="mx-2.5 text-white/30">·</span>
                    <span className="font-semibold text-white">{slide.caption}</span>
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── What the photograph shows. The category and project name moved
             up beside the slide markers, where they are in view at every size;
             this row keeps the longer description, like a gallery caption. ── */}
      {/* The divider on the full-width wrapper, the content in the container:
          on the container it stopped short of both edges of a full-bleed
          photograph, which drew the box the rest of the page no longer has. */}
      <motion.div
        variants={rise} initial="hidden" animate="show"
        transition={{ delay: 0.3 }}
        className="relative border-t border-white/10"
      >
        <div className="container-x py-5 sm:py-6 md:px-[max(5rem,4vw)]">
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
                  <p className="text-sm leading-relaxed text-ink-300">{slide.line}</p>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  )
}

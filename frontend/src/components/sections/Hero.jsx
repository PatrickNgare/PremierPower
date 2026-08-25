import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, PhoneCall, ShieldCheck, MapPin, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { site, isPending, telLink } from '@/config/site'

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

export default function Hero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)
  const [fine, setFine] = useState(false)

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
      className="on-dark relative isolate flex min-h-[100svh] items-center overflow-hidden bg-ink-950"
      aria-label="Premier Power — electrical engineering and lighting"
    >
      {/* ── Layer 1: the room ─────────────────────────────────── */}
      <motion.div
        style={fine && !reduce ? { x: imgX, y: imgY } : undefined}
        className="absolute -inset-[3%] -z-30"
      >
        <img
          src="/projects/stairwell.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-center opacity-[0.55]"
        />
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
        className="container-x relative grid w-full items-center gap-14 py-28 lg:grid-cols-[1.05fr_0.95fr] lg:py-24"
      >
        <div className="max-w-2xl">
          <motion.p variants={rise} className="eyebrow">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-rgb))]" />
            Premier Power Limited
          </motion.p>

          <motion.h1
            variants={rise}
            className="mt-6 text-[clamp(2.6rem,6.4vw,5.25rem)] font-extrabold text-white"
          >
            Powering spaces.
            <span className="mt-1 block bg-gradient-to-r from-lumen-300 via-lumen-500 to-lumen-700 bg-clip-text text-transparent">
              Illuminating possibilities.
            </span>
          </motion.h1>

          <motion.p variants={rise} className="mt-7 max-w-xl text-lg leading-relaxed text-ink-300">
            Electrical engineering and lighting installation across Kenya — for hotels and
            lodges, commercial interiors, institutions, healthcare, industrial sites and
            residential developments.
          </motion.p>

          <motion.div variants={rise} className="mt-10 flex flex-wrap items-center gap-3">
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

          <motion.ul variants={rise} className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
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
          className="relative mx-auto hidden w-full max-w-md lg:block"
        >
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] backdrop-blur-xl">
            <img
              src="/projects/bar-interior.jpg"
              alt="Feature lighting in a completed commercial interior"
              loading="eager"
              decoding="async"
              className="h-72 w-full object-cover"
            />
            <div className="p-6">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-lumen-500">
                Lighting installation
              </p>
              <p className="mt-2 font-display text-xl font-bold text-white">
                Commercial interiors
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                Feature and ambient lighting designed with the interior, not fitted around it.
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-lumen-500/12 blur-3xl" />
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.8 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
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

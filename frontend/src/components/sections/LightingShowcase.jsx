import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1]

const specimens = [
  { src: '/projects/stairwell.jpg', label: 'Feature stairwell', line: 'Vertical run, warm source, no visible fixture line.' },
  { src: '/projects/dining.jpg', label: 'Hospitality dining', line: 'Layered ambient and task light across a long room.' },
  { src: '/projects/suite.jpg', label: 'Guest suite', line: 'Bedside, wardrobe and reading circuits switched independently.' },
]

/**
 * A showroom rather than a section. Dark ground, warm light, and the imagery
 * appears to illuminate the type beside it. Parallax is scroll-linked and
 * disabled under reduced motion.
 */
export default function LightingShowcase() {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const lift = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['6%', '-6%'])
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.25, 0.7, 0.25])

  return (
    <section ref={ref} className="on-dark relative isolate overflow-hidden bg-ink-950">
      <motion.div
        aria-hidden="true"
        style={{ opacity: reduce ? 0.5 : glow }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute inset-0" style={{ background: 'radial-gradient(52rem 34rem at 22% 12%, rgb(245 201 123 / 0.22), transparent 62%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(38rem 26rem at 88% 88%, rgb(255 59 47 / 0.14), transparent 62%)' }} />
      </motion.div>

      <div className="container-x section">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p className="eyebrow">
              <Sparkles size={13} aria-hidden="true" />
              Lighting
            </p>
            <h2 className="mt-6 text-[clamp(2.1rem,4.2vw,3.4rem)] font-extrabold text-white">
              Illuminate better.
              <span className="block text-glow bg-gradient-to-r from-lumen-300 to-lumen-700 bg-clip-text text-transparent">
                Live brighter.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-300">
              Lighting is designed with the interior rather than fitted around it — circuits
              planned to the room's use, sources placed so the fixture disappears and only the
              light remains.
            </p>
            <p className="mt-4 max-w-md leading-relaxed text-ink-400">
              Feature, ambient and task layers switched independently, so one space can be a
              working room at nine and a dining room at eight.
            </p>
            <Link to="/portfolio" className="btn-primary group mt-9">
              See lighting projects
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div style={{ y: lift }} className="grid gap-4 sm:grid-cols-2">
            {specimens.map((s, i) => (
              <motion.figure
                key={s.label}
                initial={{ opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, ease: EASE, delay: i * 0.1 }}
                className={`group relative overflow-hidden rounded-[var(--radius-card)] border border-white/10 ${
                  i === 0 ? 'sm:row-span-2 h-[26rem] sm:h-auto' : 'h-56'
                }`}
              >
                <img
                  src={s.src} alt={s.label} loading="lazy" decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-base font-bold text-white">{s.label}</p>
                  <p className="mt-1 text-xs leading-snug text-ink-300 opacity-0 transition-all duration-500 group-hover:opacity-100">
                    {s.line}
                  </p>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, MapPin, Layers, Quote, Expand } from 'lucide-react'
import Lightbox from '@/components/ui/Lightbox'
import ImageReveal from '@/components/ui/ImageReveal'
import { fadeUp, stagger, inView } from '@/utils/motion'
// The full list from the company profile, not the nine shown on the site.
import { projects } from '@/data/projects'
import { photo } from '@/utils/photo'

const LOCATIONS = ['Nairobi', 'Nanyuki', 'Laikipia', 'Meru', 'Mua Hills', 'Mlolongo', 'Maasai Mara']
const ARCHITECTS = ['Seltar Crafts Ltd', 'Designspec Ltd', 'Construe Consultants Ltd', 'N.A Projects International Ltd']

/**
 * Bento composition. Tiles are deliberately unequal — a tall photograph, a
 * quiet mission statement, two dense data tiles — so the section reads as an
 * arrangement rather than another row of cards. Every fact here comes from the
 * company profile.
 */
export default function AboutBento() {
  const [open, setOpen] = useState(null)
  const items = [{
    src: photo('/projects/resort-dusk.jpg'),
    alt: 'Completed resort development at dusk',
    title: 'Completed resort development',
    caption: 'Hospitality · Kenya',
  }]

  return (
    <motion.div
      variants={stagger(0.07)}
      {...inView}
      className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[13rem_13rem_13rem]"
    >
      {/* Tall photograph — anchors the arrangement. */}
      <motion.figure
        variants={fadeUp}
        className="group relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 sm:col-span-2 lg:row-span-2"
      >
        <ImageReveal
          src={photo('/projects/resort-dusk.jpg')} alt="Completed resort development at dusk"
          drift={3}
          className="h-full min-h-[15rem] w-full sm:min-h-[20rem]"
          imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-105"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
        <button
          type="button" onClick={() => setOpen(0)}
          className="absolute inset-0 cursor-zoom-in"
          aria-label="View completed resort development larger"
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white opacity-0 backdrop-blur-sm transition-opacity duration-500 group-hover:opacity-100">
          <Expand size={15} />
        </span>
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-7">
          <p className="font-display text-2xl font-bold text-white">
            {projects.length} projects across Kenya
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-300">
            Hospitality, commercial interiors and residential developments — with the
            contractors and architects who designed them.
          </p>
        </figcaption>
      </motion.figure>

      {/* Mission — quiet, typographic, warm ground. */}
      <motion.blockquote
        variants={fadeUp}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-lumen-100 p-6 sm:col-span-2 sm:p-7"
      >
        <Quote size={20} className="text-lumen-700" aria-hidden="true" />
        <p className="mt-4 font-display text-lg font-bold leading-snug text-ink-900">
          “To provide the best enhanced quality, innovative, safe and flexible electrical
          services.”
        </p>
        <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
          Premier Power Limited — our mission
        </footer>
      </motion.blockquote>

      {/* Registration */}
      <motion.div
        variants={fadeUp}
        className="group relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white p-7"
      >
        <ShieldCheck size={20} className="text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
        <p className="mt-4 font-display text-base font-bold text-ink-900">NCA registered</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Electrical Engineering Service Contractor, National Construction Authority.
        </p>
      </motion.div>

      {/* Sectors */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white p-7"
      >
        <Layers size={20} className="text-[rgb(var(--accent-rgb))]" aria-hidden="true" />
        <p className="mt-4 font-display text-base font-bold text-ink-900">Seven sectors</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Hospitality, commercial, residential, offices, healthcare, institutions and
          industrial.
        </p>
      </motion.div>

      {/* Wide data tile — locations, on the dark ground for contrast. */}
      <motion.div
        variants={fadeUp}
        className="on-dark relative isolate flex flex-col justify-center overflow-hidden rounded-[var(--radius-card)] bg-ink-950 p-7 sm:col-span-2"
      >
        <div aria-hidden="true" className="ambient-warm absolute inset-0 -z-10" />
        <MapPin size={20} className="text-lumen-500" aria-hidden="true" />
        <p className="mt-4 font-display text-base font-bold text-white">Working nationwide</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {LOCATIONS.map((l) => (
            <li key={l} className="rounded-full border border-white/15 px-3 py-1 text-xs text-ink-300">
              {l}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Wide data tile — architects worked with. */}
      <motion.div
        variants={fadeUp}
        className="relative hidden overflow-hidden rounded-[var(--radius-card)] border border-ink-900/10 bg-white p-7 sm:col-span-2 sm:block"
      >
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Delivered alongside
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {ARCHITECTS.map((a) => (
            <li key={a} className="flex items-center gap-2.5 text-sm text-ink-700">
              <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[rgb(var(--accent-rgb))]" />
              {a}
            </li>
          ))}
        </ul>
      </motion.div>
      <Lightbox items={items} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </motion.div>
  )
}

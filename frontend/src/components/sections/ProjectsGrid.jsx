import { motion } from 'framer-motion'
import { FiMapPin } from 'react-icons/fi'
import { fadeUp, stagger, inView } from '@/utils/motion'
import Photo from '@/components/ui/Photo'
import Badge from '@/components/ui/Badge'
import { useApi } from '@/hooks/useApi'
import { demoPhotos } from '@/config/demo'

/**
 * Installations, framed around the stage that matters. Finished rooms prove
 * nothing — the board and the open chase do.
 */
const fallback = [
  {
    title: 'Two-bedroom apartment, full rewire',
    location: 'Kilimani, Nairobi',
    summary: 'Complete rewire of a 1990s flat: new consumer unit, RCD protection on every circuit, and a labelled schedule inside the door.',
    image_open_url: '', image_finished_url: '',
    image_open_alt: 'Consumer unit with the cover removed showing the replacement board wired and labelled',
    image_finished_alt: 'The finished installation with accessories fitted',
    briefOpen: 'The consumer unit with its cover off — every way labelled, conductors dressed.',
    demoKey: 'boardAfter',
  },
  {
    title: 'Chase run, first fix',
    location: 'Westlands, Nairobi',
    summary: 'Chases cut and conductors run, photographed from a fixed position so the same framing could be repeated after plastering.',
    image_open_url: '', image_finished_url: '',
    image_open_alt: 'A wall with chases open and conductors run through conduit before plastering',
    image_finished_alt: 'The same wall after plastering with sockets fitted',
    briefOpen: 'A wall with chases open and conductors run — conduit, cable, back boxes visible.',
    demoKey: 'chaseOpen',
  },
  {
    title: 'Board replacement, occupied home',
    location: 'Kileleshwa, Nairobi',
    summary: 'Old rewirable fuse board replaced with a modern consumer unit, circuits separated so one fault no longer darkens the house.',
    image_open_url: '', image_finished_url: '',
    image_open_alt: 'An old consumer unit with rewirable fuses before replacement',
    image_finished_alt: 'The replacement board fitted and labelled',
    briefOpen: 'The existing board before work — rewirable fuses and any previous electrician’s wiring visible.',
    demoKey: 'boardBefore',
  },
]

export default function ProjectsGrid({ limit }) {
  const { data } = useApi('/projects', fallback)
  const shown = limit ? data.slice(0, limit) : data

  return (
    <motion.div variants={stagger(0.08)} {...inView} className="mt-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((p) => (
        <motion.article key={p.title} variants={fadeUp} className="card group overflow-hidden">
          <div className="overflow-hidden">
            <Photo
              src={p.image_open_url || undefined}
              demoSrc={demoPhotos[p.demoKey]}
              alt={p.image_open_alt}
              brief={p.briefOpen ?? 'Installation photograph, shot while the work is still open.'}
              ratio="4 / 3"
              sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 31vw"
              className="w-full rounded-none transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="p-6">
            <Badge tone="accent" size="sm">Photographed open</Badge>
            <h3 className="mt-3 font-heading text-lg font-semibold text-primary">{p.title}</h3>
            {p.location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                <FiMapPin size={12} className="text-secondary-accent" aria-hidden="true" /> {p.location}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{p.summary}</p>
          </div>
        </motion.article>
      ))}
    </motion.div>
  )
}

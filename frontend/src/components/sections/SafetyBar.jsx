import { motion } from 'framer-motion'
import { FiFileText, FiSearch, FiZap, FiShield } from 'react-icons/fi'
import { fadeUp, stagger, inView } from '@/utils/motion'

/**
 * The vertical's equivalent of an awards strip: what actually earns trust for
 * an electrician is licensing and testing, not badges.
 */
const marks = [
  { icon: FiShield, title: 'EPRA licensed', body: 'Number published on every page so you can verify it before calling.' },
  { icon: FiFileText, title: 'Tested & certified', body: 'Full test sequence recorded, certificate handed over at completion.' },
  { icon: FiSearch, title: 'Photographed open', body: 'Every circuit documented while the wall is still open.' },
  { icon: FiZap, title: 'KEBS standards', body: 'Materials and workmanship to the current Kenyan standard.' },
]

export default function SafetyBar() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50">
      <motion.ul variants={stagger(0.07)} {...inView} className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {marks.map(({ icon: Icon, title, body }) => (
          <motion.li key={title} variants={fadeUp} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-neutral-200">
              <Icon size={19} className="text-secondary-accent" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-heading text-sm font-semibold text-primary">{title}</h3>
              <p className="mt-1 text-sm leading-snug text-neutral-600">{body}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}

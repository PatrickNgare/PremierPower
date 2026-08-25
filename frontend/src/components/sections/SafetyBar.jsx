import { motion } from 'framer-motion'
import { FiFileText, FiSearch, FiZap, FiShield } from 'react-icons/fi'
import { fadeUp, stagger, inView } from '@/utils/motion'

/**
 * The vertical's equivalent of an awards strip: what actually earns trust for
 * an electrician is licensing and testing, not badges.
 */
const marks = [
  { icon: FiShield, title: 'NCA registered', body: 'Electrical Engineering Service Contractor, registered with the National Construction Authority.' },
  { icon: FiFileText, title: 'Tested & certified', body: 'Full test sequence recorded and certified before handover on every project.' },
  { icon: FiSearch, title: 'Private & public sector', body: 'Delivered with leading contractors and architects across both.' },
  { icon: FiZap, title: 'Nationwide', body: 'Projects across the country, from Nairobi to Nanyuki, Meru and the Mara.' },
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

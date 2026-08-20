import { DEMO } from '@/config/demo'

/**
 * Present on every page of a demo build. A demo that cannot be distinguished
 * from the live site is how sample data ends up in front of customers.
 */
export default function DemoRibbon() {
  if (!DEMO) return null
  return (
    <div className="bg-primary-dark px-4 py-1.5 text-center">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white">
        Demo build · sample data · licence number and reviews are not real
      </p>
    </div>
  )
}

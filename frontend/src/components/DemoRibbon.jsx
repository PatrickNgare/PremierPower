import { DEMO } from '../config/demo'

/**
 * Present on every page of a demo build. A demo that cannot be distinguished
 * from the live site is how sample data ends up in front of customers.
 */
export default function DemoRibbon() {
  if (!DEMO) return null
  return (
    <div className="sticky top-0 z-50 bg-graphite-900 px-4 py-1.5 text-center">
      <p className="font-mono text-[0.7rem] uppercase tracking-wider text-plaster-100">
        Demo build · sample data · licence number and reviews are not real
      </p>
    </div>
  )
}

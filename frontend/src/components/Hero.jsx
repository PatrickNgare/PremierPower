import { motion } from 'framer-motion'
import Button from './Button'
import LicenseBadge from './LicenseBadge'
import Photo from './Photo'
import ChaseRoute from './ChaseRoute'
import { whatsappLink } from '../config/site'
import { demoPhotos } from '../config/demo'

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function Hero() {
  const wa = whatsappLink()
  return (
    <section className="plaster relative overflow-hidden">
      {/* The chase enters here and drops toward the page. */}
      <ChaseRoute
        className="pointer-events-none absolute left-4 top-0 hidden h-full w-36 xl:block"
        viewBox="0 0 40 400"
        d="M20 0 V400"
        outlets={[{ x: 20, y: 232, at: 0.7 }]}
      />

      <div className="mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div>
          <motion.h1
            variants={rise} initial="hidden" animate="show" custom={0}
            className="max-w-[15ch] text-[clamp(2.5rem,6.2vw,4.25rem)] font-semibold leading-[0.98] text-graphite-900"
          >
            Everything we hide in your walls, you see first.
          </motion.h1>

          <motion.p
            variants={rise} initial="hidden" animate="show" custom={1}
            className="mt-6 max-w-[52ch] text-lg leading-relaxed text-graphite-500"
          >
            Licensed residential wiring and rewiring across Nairobi. We mark out every
            chase on the bare wall, photograph every circuit before the plaster closes,
            and hand you the test certificate at the end.
          </motion.p>

          <motion.div
            variants={rise} initial="hidden" animate="show" custom={2}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/contact" size="lg">Book a free site assessment</Button>
            {wa && (
              <Button href={wa} variant="outline" size="lg" target="_blank" rel="noopener noreferrer">
                Ask on WhatsApp
              </Button>
            )}
          </motion.div>

          <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-8">
            <LicenseBadge />
          </motion.div>
        </div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={2}>
          <Photo
            priority
            demoSrc={demoPhotos.heroWall}
            ratio="4 / 5"
            className="w-full"
            sizes="(max-width: 1024px) 92vw, 44vw"
            brief="A bare wall marked out in pencil before cutting — socket heights, switch drops and chase routes visible, ideally with the electrician's rule still against it. This is the single most important image on the site."
            alt="A wall marked out in pencil with socket heights and chase routes before cutting"
          />
        </motion.div>
      </div>
    </section>
  )
}

/**
 * Motion system.
 *
 * Timings and easings live here rather than being retyped per component, so
 * the whole site moves to one rhythm. Bands follow the brief:
 *   interaction  200-400ms   a control answering a pointer
 *   component    300-600ms   something entering or leaving
 *   cinematic    600-1000ms  a deliberate reveal
 */
export const DUR = {
  tap: 0.18,
  interaction: 0.28,
  control: 0.36,
  component: 0.5,
  entrance: 0.65,
  cinematic: 0.85,
  sweep: 1.1,
}

/** Decelerating: motion arrives quickly and settles. The default. */
export const EASE_OUT = [0.22, 1, 0.36, 1]
/** Symmetric: for things that move and return, like a parallax drift. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]
/** Sharp exit: for something leaving that should not linger. */
export const EASE_EXIT = [0.4, 0, 1, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.entrance, ease: EASE_OUT } },
}

/** Fade, rise and sharpen — the house entrance. */
export const riseBlur = {
  hidden: { opacity: 0, y: 22, filter: 'blur(7px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: DUR.entrance, ease: EASE_OUT } },
}

/** Settles up to its true size rather than popping. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: DUR.component, ease: EASE_OUT } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.component } },
}

export const stagger = (delay = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
})

/** Reveal once, on entry. Re-animating on every pass is distracting. */
export const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.2 } }

/** Same, for tall sections where 20% never comes into view at once. */
export const inViewSoft = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.08 } }

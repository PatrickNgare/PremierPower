/** Shared motion variants, so entrances stay identical across sections. */
export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45 } },
}

export const stagger = (delay = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})

/** Applied to sections so they animate once, on entry. */
export const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, amount: 0.2 } }

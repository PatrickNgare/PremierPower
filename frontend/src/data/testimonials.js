import { DEMO, demoTestimonials } from '../config/demo'

/**
 * Real reviews only. Ships empty until the client supplies them — the
 * component renders an honest gap rather than invented praise.
 * Prioritise reviews mentioning safety and reliability over aesthetics.
 */
const real = []

export const testimonials = DEMO ? demoTestimonials : real

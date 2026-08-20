/**
 * Client-supplied truth.
 *
 * Every value marked PENDING is a launch blocker (see PRODUCT.md). They are
 * wrapped so the UI can render them as visibly unconfirmed rather than
 * silently shipping a fake licence number or a dead phone line.
 */

export const PENDING = Symbol('pending')

/** Wraps a value the client has not supplied yet. */
const pending = (hint) => ({ [PENDING]: true, hint })

export const isPending = (v) => Boolean(v && typeof v === 'object' && v[PENDING])

/** Renders a value, or its hint when the client has not supplied it. */
export const value = (v, fallback = '') => (isPending(v) ? fallback || `[${v.hint}]` : v)

import { DEMO, demoOverrides } from '@/config/demo'

const real = {
  name: 'PremierPower',
  tagline: 'Residential wiring and rewiring, drawn before it is buried.',

  // --- Contact -------------------------------------------------------------
  phone: pending('phone number'),
  whatsapp: pending('WhatsApp number, digits only, incl. 254 country code'),
  email: pending('email address'),

  // --- NAP for LocalBusiness JSON-LD --------------------------------------
  legalName: pending('registered business name'),
  street: pending('street address'),
  locality: 'Nairobi',
  region: 'Nairobi County',
  country: 'KE',
  serviceArea: pending('service radius, e.g. "Nairobi and within 40km"'),

  // --- Trust ---------------------------------------------------------------
  epraNumber: pending('EPRA licence number'),
  epraClass: pending('EPRA licence class'),
  insured: pending('insurer name, or false if not insured'),
  warranty: pending('workmanship warranty term, e.g. "2 years"'),
  yearsLicensed: pending('years licensed'),
  installsCompleted: pending('installations completed'),
  responseTime: pending('typical response time, e.g. "same day"'),
}

/** Demo values fill the gaps only when VITE_DEMO=1. */
export const site = DEMO ? { ...real, ...demoOverrides } : real

/** WhatsApp deep link with a prefilled message. */
export function whatsappLink(message = "Hi PremierPower, I'd like to book a free site assessment.") {
  if (isPending(site.whatsapp)) return null
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`
}

export function telLink() {
  if (isPending(site.phone)) return null
  return `tel:${String(site.phone).replace(/\s+/g, '')}`
}

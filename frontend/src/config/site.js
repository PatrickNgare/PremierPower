/**
 * Client-supplied truth.
 *
 * Every value marked PENDING is a launch blocker (see PRODUCT.md). They are
 * wrapped so the UI can render them as visibly unconfirmed rather than
 * silently shipping a fake licence number or a dead phone line.
 */

const PENDING = Symbol('pending')

/** Wraps a value the client has not supplied yet. */
const pending = (hint) => ({ [PENDING]: true, hint })

export const isPending = (v) => Boolean(v && typeof v === 'object' && v[PENDING])

/** Renders a value, or its hint when the client has not supplied it. */
export const value = (v, fallback = '') => (isPending(v) ? fallback || `[${v.hint}]` : v)

import { DEMO, demoOverrides } from '@/config/demo'

const real = {
  name: 'Premier Power Limited',
  tagline: 'Electrical engineering and installation across Kenya — corporate, commercial and residential.',

  // --- Contact -------------------------------------------------------------
  phone: '+254 719 509 574',
  whatsapp: '254719509574',
  email: 'premierpower.ltd@gmail.com',

  // --- NAP for LocalBusiness JSON-LD --------------------------------------
  legalName: 'Premier Power Limited',
  street: 'Forest Court, Forest Road',
  locality: 'Nairobi',
  region: 'Nairobi County',
  country: 'KE',
  serviceArea: 'Nairobi and nationwide',

  // --- Trust ---------------------------------------------------------------
  // Registered with the National Construction Authority as an Electrical
  // Engineering Service Contractor. The registration number itself is not
  // legible in the profile PDF and must be confirmed before launch.
  ncaNumber: pending('NCA registration number — confirm with the client'),
  ncaCategory: 'Electrical Engineering Service Contractor',
  insured: pending('insurer name, or false if not insured'),
  warranty: pending('workmanship warranty term, e.g. "2 years"'),
  secondPhone: '+254 705 720 502',
  yearsLicensed: pending('years trading — confirm with the client'),
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

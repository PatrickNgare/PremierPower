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
  // EPRA licences the electrical work; NCA registers the contractor. They are
  // different regulators covering different things, and this company holds
  // both. An earlier build dropped EPRA on the reading that it had come from a
  // generic blueprint; the client has since confirmed it.
  epraNumber: pending('EPRA Electrical Contractor Licence number — confirm with the client'),
  epraClass: pending('EPRA contractor class, e.g. "Class A1"'),
  insured: pending('insurer name, or false if not insured'),
  warranty: pending('workmanship warranty term, e.g. "2 years"'),
  secondPhone: '+254 705 720 502',
  yearsLicensed: pending('years trading — confirm with the client'),
  installsCompleted: pending('installations completed'),
  responseTime: pending('typical response time, e.g. "same day"'),

  // --- Google Business Profile ---------------------------------------------
  googleProfile: 'https://g.page/r/Ce4hbCGre_4GEBI',
  googleReview: 'https://g.page/r/Ce4hbCGre_4GEBI/review',
}

/** Demo values fill the gaps only when VITE_DEMO=1. */
export const site = DEMO ? { ...real, ...demoOverrides } : real

/**
 * Company details as stored in the CMS use snake_case keys; the site reads
 * camelCase. Mapped explicitly rather than transformed, so adding a detail is
 * a deliberate act and a typo in the CMS cannot invent a site field.
 */
const FROM_SETTINGS = {
  phone: 'phone',
  secondPhone: 'phone_secondary',
  whatsapp: 'whatsapp',
  email: 'email',
  legalName: 'legal_name',
  street: 'street',
  serviceArea: 'service_area',
  ncaNumber: 'nca_number',
  ncaCategory: 'nca_category',
  epraNumber: 'epra_number',
  epraClass: 'epra_class',
  insured: 'insured',
  warranty: 'warranty',
  yearsLicensed: 'years_trading',
  installsCompleted: 'projects_completed',
  responseTime: 'response_time',
}

/**
 * Overlay what the client has filled in, leaving everything else as it was.
 *
 * The API only returns non-empty values, so a blank field in the CMS keeps
 * whatever the bundled config says — including a `pending(...)` marker, which
 * is what makes the site render an honest gap instead of a fake licence
 * number.
 */
export function withSettings(base, settings) {
  if (!settings) return base
  const merged = { ...base }
  for (const [field, key] of Object.entries(FROM_SETTINGS)) {
    const v = settings[key]
    if (typeof v === 'string' && v.trim()) merged[field] = v.trim()
  }
  return merged
}

/** WhatsApp deep link with a prefilled message.
 *  `from` lets a component pass the live, CMS-merged values; without it these
 *  fall back to the bundled config. */
export function whatsappLink(
  message = "Hi PremierPower, I'd like to book a free site assessment.",
  from = site,
) {
  // Most callers want the default message and pass only the live details:
  // whatsappLink(site). Without this the details object became the message
  // and WhatsApp opened with "[object Object]" typed in.
  if (message && typeof message === 'object') [message, from] = [undefined, message]
  message ??= "Hi PremierPower, I'd like to book a free site assessment."
  if (isPending(from.whatsapp)) return null
  return `https://wa.me/${from.whatsapp}?text=${encodeURIComponent(message)}`
}

export function telLink(from = site) {
  if (isPending(from.phone)) return null
  return `tel:${String(from.phone).replace(/\s+/g, '')}`
}

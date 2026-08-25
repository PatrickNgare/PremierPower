/**
 * Demo data.
 *
 * Turn on with VITE_DEMO=1 so the site renders full for review and client
 * presentation. Everything here is invented and says so on screen.
 *
 * Two fields are deliberately NOT given realistic values: the NCA registration
 * number and the testimonials. A plausible-looking licence number on an
 * electrician's site is a false credential claim in a regulated trade, and
 * invented reviews are fabricated social proof. Both render as visibly
 * labelled dummy data instead, so a demo build can never be mistaken for — or
 * quietly promoted into — the real thing.
 */

export const DEMO = import.meta.env.VITE_DEMO === '1'

export const demoOverrides = {
  // Contact details, address and the project list are now real, from the
  // company profile — demo mode must not shadow them with invented values.
  // Only what the client has still not supplied is filled in here.
  warranty: '2 years (dummy)',
  yearsLicensed: '10 (dummy)',
  installsCompleted: '40+ (dummy)',
  responseTime: 'Same day (dummy)',

  // Not a real or realistic registration number. The NCA certificate in the
  // company profile is a blank template with no number on it.
  ncaNumber: 'DUMMY — not a registration',
}

export const demoTestimonials = [
  {
    name: 'Dummy review',
    location: 'Lavington',
    job: 'Full rewire, three-bedroom',
    quote:
      'Dummy text standing in for a real customer review. Replace this before launch — reviews that mention safety and reliability do the most work here.',
  },
  {
    name: 'Dummy review',
    location: 'Westlands',
    job: 'Consumer unit upgrade',
    quote:
      'Dummy text standing in for a real customer review. The admin CMS sorts safety-mentioning reviews to the front automatically.',
  },
  {
    name: 'Dummy review',
    location: 'Kileleshwa',
    job: 'Fault finding',
    quote:
      'Dummy text standing in for a real customer review. Three genuine reviews is the minimum before this section should go live.',
  },
]

/**
 * Project imagery, extracted from the company profile PDF. These are Premier
 * Power's own projects, so unlike the earlier placeholders they can ship —
 * subject to the client confirming which images they hold rights to publish.
 */
export const demoPhotos = {
  hospitality: '/projects/hospitality.jpg',
  lodge: '/projects/lodge.jpg',
  technical: '/projects/technical.jpg',
  residential: '/projects/residential.jpg',
  villas: '/projects/villas.jpg',
  apartments: '/projects/apartments.jpg',
  clubhouse: '/projects/clubhouse.jpg',
  houseExterior: '/projects/house-exterior.jpg',
  interior: '/projects/interior.jpg',
  stairDetail: '/projects/stair-detail.jpg',
}

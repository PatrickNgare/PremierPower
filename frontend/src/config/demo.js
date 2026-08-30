import { photo } from '@/utils/photo'
/**
 * Demo data.
 *
 * Turn on with VITE_DEMO=1 so the site renders full for review and client
 * presentation. Everything here is invented and says so on screen.
 *
 * Placeholder values are unmarked in the display so the layout reads cleanly.
 * They are flagged by a marker beside each figure and a footnote under the
 * band instead, and the NCA registration number is still never given a
 * realistic value. A plausible-looking licence number on an
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
  warranty: '2 years',
  yearsLicensed: '10',
  installsCompleted: '40+',
  responseTime: 'Same day',

  // Not a real or realistic registration number. The NCA certificate in the
  // company profile is a blank template with no number on it.
  ncaNumber: 'DUMMY — not a registration',
  epraNumber: 'DUMMY — not a licence',
  epraClass: 'DUMMY — not a class',
}

export const demoTestimonials = [
  {
    name: 'Client name',
    location: 'Lavington',
    job: 'Full rewire, three-bedroom',
    quote:
      'Dummy text standing in for a real customer review. Replace this before launch — reviews that mention safety and reliability do the most work here.',
  },
  {
    name: 'Client name',
    location: 'Westlands',
    job: 'Consumer unit upgrade',
    quote:
      'Dummy text standing in for a real customer review. The admin CMS sorts safety-mentioning reviews to the front automatically.',
  },
  {
    name: 'Client name',
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
  hospitality: photo('/projects/hospitality.jpg'),
  lodge: photo('/projects/lodge.jpg'),
  technical: photo('/projects/technical.jpg'),
  residential: photo('/projects/residential.jpg'),
  villas: photo('/projects/villas.jpg'),
  apartments: photo('/projects/apartments.jpg'),
  clubhouse: photo('/projects/clubhouse.jpg'),
  houseExterior: photo('/projects/house-exterior.jpg'),
  interior: photo('/projects/interior.jpg'),
  stairDetail: photo('/projects/stair-detail.jpg'),
}

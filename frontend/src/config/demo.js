/**
 * Demo data.
 *
 * Turn on with VITE_DEMO=1 so the site renders full for review and client
 * presentation. Everything here is invented and says so on screen.
 *
 * Two fields are deliberately NOT given realistic values: the EPRA licence
 * number and the testimonials. A plausible-looking licence number on an
 * electrician's site is a false credential claim in a regulated trade, and
 * invented reviews are fabricated social proof. Both render as visibly
 * labelled samples instead, so a demo build can never be mistaken for — or
 * quietly promoted into — the real thing.
 */

export const DEMO = import.meta.env.VITE_DEMO === '1'

export const demoOverrides = {
  phone: '0722 000 000',
  whatsapp: '254722000000',
  email: 'hello@premierpower.example',

  legalName: 'PremierPower Electrical Ltd (sample)',
  street: '00 Sample Road, Kilimani',
  serviceArea: 'Nairobi and within 40km',

  // Not a real or realistic licence number — see the note above.
  epraNumber: 'SAMPLE — not a licence',
  epraClass: 'Class A (sample)',
  insured: 'Sample Insurance Ltd',
  warranty: '2 years',
  yearsLicensed: '12',
  installsCompleted: '480',
  responseTime: 'Same day',
}

export const demoTestimonials = [
  {
    name: 'Sample review',
    location: 'Lavington',
    job: 'Full rewire, three-bedroom',
    quote:
      'Placeholder text standing in for a real customer review. Replace this before launch — reviews that mention safety and reliability do the most work here.',
  },
  {
    name: 'Sample review',
    location: 'Westlands',
    job: 'Consumer unit upgrade',
    quote:
      'Placeholder text standing in for a real customer review. The admin CMS sorts safety-mentioning reviews to the front automatically.',
  },
  {
    name: 'Sample review',
    location: 'Kileleshwa',
    job: 'Fault finding',
    quote:
      'Placeholder text standing in for a real customer review. Three genuine reviews is the minimum before this section should go live.',
  },
]

/**
 * Drop real images into frontend/public/demo/ using these filenames and demo
 * mode will pick them up automatically — useful when showing the client a
 * version that looks finished.
 */
export const demoPhotos = {
  heroWall: '/demo/marked-wall.jpg',
  chaseOpen: '/demo/chase-open.jpg',
  chaseFinished: '/demo/chase-finished.jpg',
  boardBefore: '/demo/board-before.jpg',
  boardAfter: '/demo/board-after.jpg',
  team: '/demo/team.jpg',
}

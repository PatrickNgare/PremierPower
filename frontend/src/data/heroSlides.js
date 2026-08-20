/**
 * Hero carousel slides. Each pairs a headline against one demo photo key
 * (see config/demo.js `demoPhotos`) — until the client supplies the real
 * shot, `Photo` renders an honest labelled gap instead, same as everywhere
 * else on the site.
 */
export const heroSlides = [
  {
    eyebrow: 'Before the plaster closes',
    headline: 'Everything we hide in your walls, you see first.',
    body: 'Licensed residential wiring and rewiring across Nairobi. We mark out every chase on the bare wall, photograph every circuit before the plaster closes, and hand you the test certificate at the end.',
    photoKey: 'heroWall',
    alt: 'A wall marked out in pencil with socket heights and chase routes before cutting',
    brief: 'A bare wall marked out in pencil before cutting — socket heights, switch drops and chase routes visible, ideally with the electrician’s rule still against it.',
    ratio: '4 / 5',
  },
  {
    eyebrow: 'While the chase is open',
    headline: 'Every run photographed while it can still be checked.',
    body: 'Cable routes, joint boxes and depths recorded before anything is covered — so what’s behind your wall is documented, not guessed at.',
    photoKey: 'chaseOpen',
    alt: 'An open wall chase with cable run visible before it is filled and skimmed',
    brief: 'An open chase mid-installation, cable laid in, before filling.',
    ratio: '4 / 5',
  },
  {
    eyebrow: 'At the consumer unit',
    headline: 'Boards tested before we call the job finished.',
    body: 'Continuity, insulation resistance, polarity, earth fault loop impedance and RCD operation — every installation gets the full sequence, recorded and handed to you.',
    photoKey: 'boardAfter',
    alt: 'A completed consumer unit, labelled and tested, ready for handover',
    brief: 'The finished consumer unit — labelled circuits, tidy cable management, board on and tested.',
    ratio: '4 / 5',
  },
  {
    eyebrow: 'Who does the work',
    headline: 'Licensed electricians, not day labour.',
    body: 'Every installer on site is EPRA-licensed and named on your job. You can verify us before you ever pick up the phone.',
    photoKey: 'team',
    alt: 'A licensed electrician on site',
    brief: 'The electrician(s) who will actually be on site — in work clothes, mid-task, not a posed studio shot.',
    ratio: '4 / 5',
  },
]

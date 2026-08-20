/**
 * The four stages carry real state, and the sequence itself is the
 * information — which is what earns the numbering.
 */
export const stages = [
  {
    n: 1,
    title: 'Survey',
    when: 'Free, about an hour',
    body: 'We walk the property, open the board, test what is there, and photograph it. You get the findings in writing whether or not you hire us.',
    mark: 'measured',
  },
  {
    n: 2,
    title: 'Marking out',
    when: 'Before any cutting',
    body: 'Socket heights, switch drops, and every chase route go onto the bare wall in pencil. Nothing is cut until you have walked the marked wall and agreed it.',
    mark: 'drawn',
  },
  {
    n: 3,
    title: 'Rough-in',
    when: 'Walls open',
    body: 'Chases cut, conduit and conductors run, board positioned. This is the stage nobody photographs and everybody should — so we do, every circuit, and the set is yours.',
    mark: 'run',
  },
  {
    n: 4,
    title: 'Test and certify',
    when: 'Before plaster closes, and again at handover',
    body: 'Continuity, insulation resistance, polarity, and earth loop impedance, recorded. You receive the circuit schedule, the test results, and the certificate.',
    mark: 'certified',
  },
]

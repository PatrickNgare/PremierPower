import { photo } from '@/utils/photo'
/**
 * The sectors Premier Power works in, exactly as listed in the company
 * profile under "Works undertaken by Premier Power Ltd Include".
 */
export const sectors = [
  // `image` is set only where the profile actually contains a photograph of
  // that kind of work. The rest stay text — no stand-in imagery.
  { title: 'Hotels, lodges & resorts', body: 'Hospitality developments where the installation has to survive continuous operation.', image: photo('/projects/resort-pool.jpg'), alt: 'Completed resort development' },
  { title: 'Residential housing', body: 'Villas, apartments and town houses, from single homes to multi-unit clusters.', image: photo('/projects/villa-modern.jpg'), alt: 'Completed residential villa' },
  { title: 'Commercial interiors', body: 'Bars, restaurants and retail interiors delivered to programme with the main contractor.', image: photo('/projects/bar-interior.jpg'), alt: 'Completed commercial interior' },
  { title: 'Banks & office buildings', body: 'Branch fit-outs and full electrical installation for new-build and refurbished offices.' },
  { title: 'Health care facilities', body: 'Installations where continuity of supply is not negotiable — theatre, diagnostics, ward.' },
  { title: 'Institutions', body: 'Schools, colleges and public-sector buildings, private and public tender.' },
  { title: 'Industrial projects', body: 'Plant and process installations, three-phase distribution and motor circuits.' },
]

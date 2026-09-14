import { photo } from '@/utils/photo'
/**
 * Hero slides. Each pairs a caption with one of the client's own project
 * photographs. The calls to action and "Powering spaces." stay fixed so the
 * hero reads as one composition; the last word of the headline changes with
 * the slide, picked by `eyebrow` (see ACCENTS in components/sections/Hero).
 */
export const heroSlides = [
  {
    eyebrow: 'Hospitality',
    caption: 'Nashulai Mara Safari Lodge',
    line: 'Guest rooms, public areas and back of house, wired to run continuously.',
    image: photo('/projects/lodge.jpg'),
    alt: 'Guest room in a completed lodge development',
    card: { label: 'Lighting installation', title: 'Hotels & lodges', line: 'Light that carries a guest from arrival to their room.' },
  },
  {
    eyebrow: 'Commercial interiors',
    caption: 'Art Caffe, Imara Mall',
    line: 'Feature and ambient lighting designed with the interior, not fitted around it.',
    image: photo('/projects/bar-interior.jpg'),
    alt: 'Feature lighting in a completed commercial interior',
    card: { label: 'Lighting installation', title: 'Commercial interiors', line: 'Bars, restaurants and retail where lighting sets the room.' },
  },
  {
    eyebrow: 'Installation',
    caption: 'First fix, on site',
    line: 'Conductors terminated and tested before anything is closed up.',
    image: photo('/projects/technical.jpg'),
    alt: 'Terminating conductors during installation',
    card: { label: 'Electrical installation', title: 'Tested & certified', line: 'Every circuit recorded and certified before handover.' },
  },
  {
    eyebrow: 'Residential',
    caption: 'Maiyan villas, Nanyuki',
    line: 'Villas, apartments and town houses across Laikipia and Nairobi.',
    image: photo('/projects/villa-dusk.jpg'),
    alt: 'Completed residential villa at dusk',
    card: { label: 'Residential', title: 'Developments', line: 'Single homes through to multi-unit clusters.' },
  },
]

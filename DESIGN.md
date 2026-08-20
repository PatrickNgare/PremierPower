# PremierPower — Design Direction

## The world: The Chase Plan

Before a single cable is pulled, the electrician marks the customer's bare wall —
socket heights, switch drops, the routes to be chased into the plaster. Then it is
cut, filled, skimmed, and gone forever. The site adopts that surface as its visual
world and that ritual as its argument:

> Everything hidden is drawn before it is buried, and the drawing is the promise.

This is the product mechanism, not a metaphor. The customer can never inspect the
wiring again once the plaster goes on, so the site's whole job is to make the
buried system legible while it is still visible.

### The rut (excluded, permanently)

- The category page: blue gradient, stock photo of a smiling man with a multimeter,
  three icon cards, lightning-bolt accents.
- Its predictable opposite: dark "premium tech," neon electric-blue glow, animated
  circuit traces, hero video.
- The literal reading of the name: PremierPower as bolts, sparks, energy imagery.

## Tokens

Taken from the supplied logo (`frontend/public/brand/logo.svg`), which overrides
any palette chosen before it existed. Exact values sampled from the artwork:
red `#FF0000`, green `#00FF00`, blacks `#000000` and `#231F20`.

- **Ground:** white / near-white. The lockup is presented on white; the site follows.
- **Line:** ink — `#231F20` for body, `#000000` for the darkest surfaces. The drawn
  chase route, rules, annotation ticks.
- **Buried:** black for "behind the wall" surfaces — footer, proof sections.
- **Action:** red. **Reserved by law** for the chased channel and primary actions.
  Never a background field, never a decorative accent. If red were deleted
  entirely, no hierarchy would change.
  - The brand red `#FF0000` carries white text at only 4.0:1, under the 4.5:1
    floor. Filled controls therefore sit one step deeper at `#E60000` (4.8:1);
    the brand red is unchanged everywhere it is not carrying text.
- **Earth:** brand green `#00FF00`. Used exactly once, as the earth mark on the
  licence badge — too light to carry text, so it stays a mark. `#0A8F3C` is
  available where a green must hold text.

## Logo

Two files, both derived from the supplied artwork. `logo.svg` is used as-is;
`logo-on-dark.svg` recolours only the black elements to white so the wordmark
survives on the black footer. Red and green are untouched in both.

## Type

- Display: Archivo Variable (self-hosted). Grotesk with a technical cast.
- Body: Inter Variable. Measure 65–75ch.
- Measurement only: JetBrains Mono Variable — dimension figures and circuit
  references, because they are measurements. Never as a "technical" costume.

## Composition

- The page is a wall elevation. A graphite chase route enters at the hero, drops
  down the page, and terminates at the distribution board, which is the contact
  block. Each section is an outlet on the run.
- Nav items are points on the route.

## Signature interaction

The **before/after wall reveal**: a drag-wipe between "chase open, wiring exposed"
and "plastered and finished." The mechanism as an interaction, driven entirely by
the client's real photographs.

## Motion

One authored moment: the chase line drawing itself in, once, on entry.
Everything else is micro — hover, focus, entrance fades. No scroll-jacking, no
pinned sections, no parallax. Under `prefers-reduced-motion` the line is already
drawn.

## Disciplines carried in from the weighed challengers

- **Registered views:** plan → wall detail → finished room shown in registration,
  so the proof reads as one continuous claim rather than a gallery.
- **Ordered stages:** the process runs as numbered stages carrying real state —
  survey, rough-in, test, certify. The sequence carries information, which is what
  earns the numbering.
- **Emphasis without colour:** every hierarchy level stays legible in greyscale.
- **Announced transitions:** each major section opens with an unmistakable marker.
- **Colour by law:** amber means action. No exceptions, no drift.
- **State as a mark:** progress and status are drawn marks, never hue alone.

## Rules

- Hero carries a **visible CTA button** above the fold: "Book a Free Site Assessment".
- "Licensed & Insured" badge with the EPRA number sits near *every* CTA.
- Mobile is the primary device. Sticky bottom bar: Call · WhatsApp · Assessment.
- Browser surfaces are themed from the palette: selection, caret, scrollbars,
  focus rings, underline offset, tabular numerals.

## Accessibility & performance floor

- Descriptive alt text on every installation photo; `alt=""` + `aria-hidden` on
  decorative imagery.
- `loading="lazy"` + `srcset`/`sizes` on all non-hero images; `fetchpriority="high"`
  on the hero image only.
- Route-based code splitting via `lazy()` per page.
- aria-labels on all icon-only controls.
- Body text ≥4.5:1, large text ≥3:1.

## Known risk

The chase-line device depends on real photography of open walls and distribution
boards. With weak or absent photos it degrades into a decorative squiggle. The
photo brief in PRODUCT.md is therefore a launch blocker, not a nice-to-have.

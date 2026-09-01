# Premier Power — Design Direction

## The world: SpaceInfra's system, Premier Power's brand

The design language is ported directly from SpaceInfra (`~/Desktop/SpaceInfra`),
the client's proven construction site — its component set, section rhythm,
typography, motion and layout conventions — carrying Premier Power's own brand
colours rather than SpaceInfra's navy and orange.

The earlier "Chase Plan" direction is retired. This document replaces it.

## Tokens

Palette sampled from the supplied logo (`frontend/public/brand/logo.svg`):
red `#FF0000`, green `#00FF00`, blacks `#000000` and `#231F20`.

Mapped onto SpaceInfra's token structure, so every class name transfers:

- `primary` — the structural dark. SpaceInfra's navy slot, filled with the
  logo's black: `#231F20`, dark `#000000`, light `#3A3436`.
- `secondary` — the accent, split by contrast duty exactly as SpaceInfra splits
  its orange:
  - `DEFAULT #FF0000` — the brand red. 5.25:1 on primary-dark; **fails** as
    white-on-red, so it is never a button fill.
  - `dark #E60000` — 4.81:1 with white. Button fills.
  - `deep #C20000` — 6.37:1 with white. Hover and active.
  - `ink #C20000` — 6.37:1 on white. Text and icons on light grounds.
  - `accent` — ground-aware, see below.
- `earth` `#00FF00` — the logo's green, used once, as the earth mark on the
  licence badge. `earth-ink #0A8F3C` where a green must carry text.
- `neutral` — SpaceInfra's greyscale, unchanged.

### The ground-aware accent

Ported from SpaceInfra verbatim. `--accent-rgb` resolves to `#C20000` on light
grounds and to the brand `#FF0000` inside any `.on-dark` container, so
`text-secondary-accent` stays legible on both without hand-picking a colour per
call site. Marking a dark section `.on-dark` fixes every accent inside it.

## Light and dark

The site ships both, switched from a control in the header — and in the admin
bar and on its sign-in screen — and remembered per visitor.

Two states, and only two. There is no "system" option in the UI, but with
nothing stored yet the switch has to start somewhere, and the operating
system's setting is a better opening position than a guess. Once someone
touches the control their choice is written down and outranks the OS from then
on.

The icon shows the theme you will *get*, not the one you are in, and the
accessible label says so out loud — an icon alone is ambiguous, and every
visitor reads it the other way round at least once.

### Roles, not pigments

Two kinds of colour token now exist, and the distinction is the whole design:

- **Pigments** — `ink-*`, `brand-*`, `lumen-*`, `white`, `earth`. Named for
  what they *are*. These do not move between themes. A section that is
  deliberately near-black stays near-black; `text-white` stays white.
- **Roles** — `surface`, `surface-2/3`, `page`, `page-warm`, `line`,
  `line-soft`, `line-firm`, `body`, `body-strong`, `body-mid`, `body-soft`.
  Named for the *duty* they perform. These are the only colours that flip.

Only roles are redefined under `:root[data-theme="dark"]`, which is why one
attribute retheme the whole site. Every light role value is byte-identical to
the literal it replaced, so light mode renders exactly as it always did —
`frontend/e2e/theme.mjs` asserts each one.

**A token cannot do both duties.** `--color-primary` was briefly repointed at
the body role and `bg-primary` promptly rendered a light band with white text
on it, because that token is a dark *ground* in two places and dark *ink* in
fourteen. If a colour is used as both, it stays a pigment and the text usages
move to a role.

### Why `data-theme` works where `.on-dark` did not

Tailwind resolves an `@theme` value once, against `:root`. That is why
`--color-muted` failed as a theme colour and had to become the `.text-muted`
utility. `data-theme` sits on `<html>`, which *is* `:root`, so overriding roles
there works. `.on-dark` is a descendant and still cannot.

The two mechanisms compose: `.on-dark` continues to mark a section as sitting
on the dark showroom ground in *either* theme, and `--accent-rgb` /
`--muted-rgb` / `.text-accent` still resolve per element.

### The elevation ladder inverts

In light mode a card is lighter than the page. In dark mode it must be too, or
every panel becomes a hole: `page #0D0E11` < `surface #16181D` <
`surface-2 #1B1E24`. The always-dark sections drop to `ink-950 #08080A` so they
stay distinct from a page ground that is now itself dark.

The warm family inverts with everything else — `lumen-100` becomes a warm dark
surface and `lumen-700` the warm light ink on it — otherwise the mission card
and every "in progress" badge render light text on cream.

### No flash

An inline, synchronous script in `index.html` sets `data-theme` before first
paint. Anything deferred — a module, an effect — runs after the browser has
already painted the light ground, so a visitor who chose dark sees a white
flash on every navigation.

The theme is one shared external store (`useSyncExternalStore`), not per
component state. Three components read it, and private copies meant clicking
the toggle left the navbar rendering the black-on-black lockup.

## Type

Two faces, self-hosted via fontsource. Nothing else ships.

- **Manrope Variable** — the display voice, at 600–800. Hero headings, section
  titles, statistics, card titles. Geometric with open counters and flat
  terminals: it reads architectural and technical rather than friendly, which
  is what a lighting brand wants. It replaced Plus Jakarta Sans, which in turn
  had replaced the Poppins this document used to name.
- **Inter Variable** — everything meant to be read rather than looked at, at
  400–600. Body copy, navigation, buttons, forms, specifications, captions.

Tracking and leading step with size rather than being set once for all
headings: -0.034em/1.04 at h1 down to -0.012em/1.3 at h4. A single pair cannot
serve a 62px hero line and an 18px card title. Body sits at 1.65 leading.
Tracking never goes below -0.04em.

Five weights are in use across the whole site — 400, 500, 600, 700, 800 — and
that is the ceiling.

## Structure

Home follows SpaceInfra's section order:

Hero → StatsBar → installations preview → SafetyBar → services → why-us (dark)
→ process → testimonials → CTABanner.

`SafetyBar` replaces SpaceInfra's `AwardsBar`: what earns trust for an
electrician is licensing and testing, not awards.

Interior pages all open with `PageHero` — dark banner, breadcrumb, eyebrow,
title, lede — so every route shares one rhythm.

## Motion

SpaceInfra's vocabulary: `fade-up`, `fade-in`, `marquee` (testimonials),
`ken-burns` (photography), and the shimmer sweep across `.btn-primary`.
Sections animate once on entry via `whileInView`.

`MotionConfig reducedMotion="user"` covers Framer Motion's JS-driven
animations; the CSS media query covers transitions; the hero carousel stops
auto-advancing under the same preference and leaves the arrows as the way
through.

## Rules that survive from the brief

- Hero carries a visible CTA above the fold: "Book a free site assessment".
- The licence badge sits near every primary action, not just on About.
- Licence number in the footer of every page.
- Mobile is the primary device: sticky bottom bar — Call · WhatsApp · Free visit.
- Client-supplied facts render as visibly unconfirmed gaps until supplied.
  Nothing invents a licence number, a phone line, or a review.

## Accessibility & performance floor

- Descriptive alt text on installation photos; `alt=""` + `aria-hidden` on
  decorative marks.
- `loading="lazy"` on all non-hero images; `fetchpriority="high"` on the hero.
- Route-based code splitting via `lazy()` per page.
- aria-labels on every icon-only control.
- Body text >=4.5:1; the accent split above is what keeps red legible on both grounds.

## Known risk

Photography is still the dependency. Every image slot renders an honest,
labelled gap that doubles as the shot list until the client supplies real work.

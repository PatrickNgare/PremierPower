/* Authored icon set — one stroke weight (1.6), one 24 box, no glyph stand-ins. */
const base = {
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round',
}

export const PhoneIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true">
    <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2.5 2.5 0 0 1-2.7 2.5C10.4 19.4 4.6 13.6 4 5.7A2.5 2.5 0 0 1 6.5 3Z" />
  </svg>
)

export const WhatsAppIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true">
    <path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8.1 19.5l-4.6 1Z" />
    <path d="M9 8.6c.3 2.9 3.2 5.6 6 6 .9.1 1.6-.6 1.6-1.5l-2-.9-1 1a7 7 0 0 1-3-3l1-1-.9-2c-.9 0-1.8.6-1.7 1.4Z" />
  </svg>
)

export const MenuIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
)

export const CloseIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
)

export const CheckIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true"><path d="m4 12.5 5 5L20 6.5" /></svg>
)

export const ArrowIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true"><path d="M4 12h15m-5.5-6 6 6-6 6" /></svg>
)

/* A consumer unit: enclosure, bus rail, ways. */
export const BoardIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3 9.5h18" />
    <path d="M7.5 9.5v9M12 9.5v9M16.5 9.5v9" />
  </svg>
)

/* A marked-out wall: dimension line with end ticks. */
export const RuleIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true">
    <path d="M4 6v12M20 6v12M4 12h16" />
    <path d="m8.5 9.5-2 2.5 2 2.5M15.5 9.5l2 2.5-2 2.5" />
  </svg>
)

/* Certificate: sheet with a seal. */
export const CertIcon = (p) => (
  <svg {...base} {...p} aria-hidden="true">
    <path d="M6 3h9l4 4v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M14.5 3v4.5H19" />
    <circle cx="12" cy="14" r="2.5" />
    <path d="M10.5 16.2 10 21l2-1.2 2 1.2-.5-4.8" />
  </svg>
)

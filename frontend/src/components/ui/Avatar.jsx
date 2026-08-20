/** Initials avatar — no invented photographs of people who do not exist. */
export default function Avatar({ name = '', size = 44, className = '' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || '—'}
    </span>
  )
}

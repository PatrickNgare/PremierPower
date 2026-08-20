/**
 * The supplied lockup, used as-is. The on-dark variant recolours only the
 * black elements to white so the wordmark survives dark surfaces; red and
 * green are untouched in both.
 */
export default function Logo({ tone = 'light', className = 'h-9' }) {
  return (
    <img
      src={tone === 'dark' ? '/brand/logo-on-dark.svg' : '/brand/logo.svg'}
      alt="Premier Power Limited"
      className={`w-auto ${className}`}
      width="1701" height="704"
    />
  )
}

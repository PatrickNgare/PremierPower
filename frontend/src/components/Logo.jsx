/**
 * The supplied lockup, used as-is. Two files: the standard mark, and a variant
 * whose black elements are white so the wordmark survives on dark surfaces.
 * Red and green are untouched in both.
 */
export default function Logo({ tone = 'light', className = 'h-9' }) {
  return (
    <img
      src={tone === 'dark' ? '/brand/logo-on-dark.svg' : '/brand/logo.svg'}
      alt="Premier Power Limited"
      className={`w-auto ${className}`}
      width="1701"
      height="704"
    />
  )
}

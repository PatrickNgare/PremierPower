/**
 * Announced transitions: every major section opens with a drawn rule that
 * reads as a marking-out tick, not a decorative divider. No eyebrow labels.
 */
export default function SectionHeader({ title, lede, tone = 'light', align = 'left', className = '' }) {
  const dark = tone === 'dark'
  return (
    <header className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}>
      <span
        aria-hidden="true"
        className={`mb-6 block h-px w-full max-w-[7rem] ${align === 'center' ? 'mx-auto' : ''} ${
          dark ? 'bg-plaster-100/35' : 'bg-graphite-900/25'
        }`}
      />
      <h2 className={`text-3xl leading-[1.1] sm:text-4xl ${dark ? 'text-plaster-50' : 'text-graphite-900'}`}>
        {title}
      </h2>
      {lede && (
        <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-buried-300' : 'text-graphite-500'}`}>
          {lede}
        </p>
      )}
    </header>
  )
}

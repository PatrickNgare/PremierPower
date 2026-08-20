const tones = {
  neutral: 'bg-neutral-100 text-neutral-700',
  accent: 'bg-secondary-dark/10 text-secondary-ink',
  dark: 'bg-white/10 text-white',
  earth: 'bg-earth-ink/10 text-earth-ink',
}

export default function Badge({ tone = 'neutral', size = 'md', className = '', children }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[0.68rem]' : 'px-3 py-1.5 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${pad} ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

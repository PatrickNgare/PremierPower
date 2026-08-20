import { FaStar } from 'react-icons/fa'

export default function StarRating({ value = 5, size = 13, className = '' }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} size={size} className={i < value ? 'text-secondary-accent' : 'text-neutral-300'} aria-hidden="true" />
      ))}
    </span>
  )
}

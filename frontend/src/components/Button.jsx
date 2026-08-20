import { Link } from 'react-router-dom'

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[0.95rem]',
  lg: 'px-7 py-4 text-base',
}

/**
 * `primary` is the only filled red surface on the site. Red means action; if
 * it were deleted the hierarchy would not change, which is the test.
 *
 * The fill is one step deeper than the brand red so white text clears 4.5:1.
 */
const variants = {
  primary:
    'bg-red-600 text-paper-50 font-semibold shadow-[0_2px_8px_-2px_rgba(35,31,32,0.28)] hover:bg-red-700 hover:shadow-[0_4px_14px_-3px_rgba(35,31,32,0.34)] active:translate-y-px',
  outline:
    'border border-ink-900/25 text-ink-800 font-medium hover:border-ink-900/50 hover:bg-ink-900/[0.04]',
  onDark:
    'border border-paper-100/30 text-paper-100 font-medium hover:border-paper-100/60 hover:bg-paper-100/[0.08]',
  quiet:
    'text-ink-700 font-medium underline decoration-ink-400 hover:decoration-ink-800',
}

export default function Button({
  as, to, href, variant = 'primary', size = 'md', className = '', children, ...rest
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out ${sizes[size]} ${variants[variant]} ${className}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>
  const Tag = as || 'button'
  return <Tag className={cls} {...rest}>{children}</Tag>
}

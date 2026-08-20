import { Link } from 'react-router-dom'

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[0.95rem]',
  lg: 'px-7 py-4 text-base',
}

/**
 * `primary` is the only amber surface on the site. Amber means action; if it
 * were deleted the hierarchy would not change, which is the test.
 */
const variants = {
  primary:
    'bg-amber-500 text-graphite-900 font-semibold shadow-[0_2px_8px_-2px_rgba(36,31,26,0.28)] hover:bg-amber-600 hover:shadow-[0_4px_14px_-3px_rgba(36,31,26,0.34)] active:translate-y-px',
  outline:
    'border border-graphite-900/25 text-graphite-800 font-medium hover:border-graphite-900/50 hover:bg-graphite-900/[0.04]',
  onDark:
    'border border-plaster-100/30 text-plaster-100 font-medium hover:border-plaster-100/60 hover:bg-plaster-100/[0.08]',
  quiet:
    'text-graphite-700 font-medium underline decoration-graphite-400 hover:decoration-graphite-800',
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

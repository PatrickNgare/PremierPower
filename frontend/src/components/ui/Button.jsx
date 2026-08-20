import { Link } from 'react-router-dom'

const variants = {
  primary: 'btn-primary',
  primaryLg: 'btn-primary-lg',
  outline: 'btn-outline',
  ghostDark: 'btn-ghost-dark',
}

export default function Button({ to, href, variant = 'primary', className = '', children, ...rest }) {
  const cls = `${variants[variant]} ${className}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>
  return <button className={cls} {...rest}>{children}</button>
}

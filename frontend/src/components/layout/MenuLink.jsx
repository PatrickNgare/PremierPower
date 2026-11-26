import { Link } from 'react-router-dom'

/**
 * A menu entry from the CMS. Internal paths use the router; an outside
 * address, or one marked "open in new tab" in Settings → Menu, opens in a
 * new tab as asked.
 */
export function MenuLink({ item, className, onClick, children }) {
  const external = /^https?:\/\//.test(item.to)
  if (external || item.newTab) {
    return (
      <a href={item.to} className={className} onClick={onClick}
        target="_blank" rel={external ? 'noopener noreferrer' : 'noopener'}>
        {children ?? item.label}
      </a>
    )
  }
  return <Link to={item.to} className={className} onClick={onClick}>{children ?? item.label}</Link>
}

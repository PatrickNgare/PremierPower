import { Fragment } from 'react'
import { Link } from 'react-router-dom'

/**
 * Long text typed in the CMS, shown as readable paragraphs.
 *
 * A deliberately small subset of Markdown, because that is what someone
 * typing into a plain text box will reach for: a blank line starts a new
 * paragraph, "## " and "### " make headings, lines starting "- " make a list,
 * **bold**, and [words](/link). Nothing else is interpreted, and no HTML from
 * the CMS is ever injected, so a stray "<" cannot break the page.
 *
 * Headings start at H2: the page's own title is the H1.
 */
export default function Prose({ text, className = '' }) {
  if (!text?.trim()) return null
  const blocks = String(text).replace(/\r\n/g, '\n').split(/\n{2,}/)

  return (
    <div className={`prose-pp space-y-5 text-[1.0625rem] leading-[1.75] text-body-soft ${className}`}>
      {blocks.map((block, i) => {
        const b = block.trim()
        if (!b) return null
        if (b.startsWith('### ')) return <h3 key={i} className="pt-3 font-display text-xl font-bold text-body">{inline(b.slice(4))}</h3>
        if (b.startsWith('## ')) return <h2 key={i} className="pt-5 font-display text-2xl font-bold text-body">{inline(b.slice(3))}</h2>
        const lines = b.split('\n')
        if (lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-6 marker:text-[rgb(var(--accent-rgb))]">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*] /, ''))}</li>)}
            </ul>
          )
        }
        if (lines.every((l) => /^\s*\d+[.)] /.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-body">
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+[.)] /, ''))}</li>)}
            </ol>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}
          </p>
        )
      })}
    </div>
  )
}

/** **bold** and [text](href) inside a line. Internal links use the router. */
function inline(s) {
  const out = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    if (m[1]) {
      out.push(<strong key={m.index} className="font-semibold text-body">{m[1]}</strong>)
    } else {
      const [, , label, href] = m
      const cls = 'font-semibold text-accent underline decoration-1 underline-offset-2 hover:decoration-2'
      if (href.startsWith('/')) out.push(<Link key={m.index} to={href} className={cls}>{label}</Link>)
      else if (/^(https?:|mailto:|tel:)/.test(href)) {
        out.push(<a key={m.index} href={href} className={cls} rel="noopener" target={href.startsWith('http') ? '_blank' : undefined}>{label}</a>)
      } else out.push(label)
    }
    last = re.lastIndex
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

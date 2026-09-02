import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Hero from '@/components/sections/Hero'
import { usePageSections } from '@/hooks/usePage'

/**
 * Temporary. Lets the hero variants be judged on a real phone, against real CMS
 * content, before one of them ships.
 *
 * Deliberately not a set of standalone mockups: those drift from the component
 * that actually renders, so what gets approved is not what gets built. This
 * mounts the real Hero with the real banners behind it, and only swaps the
 * `variant` prop.
 *
 * Delete this file, its route in App.jsx, and Hero's `variant` prop once a
 * variant is chosen.
 */
const VARIANTS = [
  { id: 'current', name: 'A · As shipped', note: 'Parallax and tilt, mouse only. No depth at all on a phone.' },
  { id: 'depth',   name: 'B · Depth',      note: 'Background and card drift as you scroll. Works on touch.' },
  { id: 'swipe',   name: 'C · Depth + swipe', note: 'B, and you drag the photograph to change slide.' },
]

export default function HeroPreview() {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('v')
  const [variant, setVariant] = useState(
    VARIANTS.some((v) => v.id === fromUrl) ? fromUrl : 'current',
  )
  const sections = usePageSections('/')

  // Mirrored to the URL so a variant can be linked to rather than described.
  useEffect(() => {
    if (params.get('v') !== variant) {
      setParams({ v: variant }, { replace: true })
    }
  }, [variant, params, setParams])

  const active = VARIANTS.find((v) => v.id === variant) ?? VARIANTS[0]

  return (
    <>
      {/* Remounted per variant. Without the key the motion values and drag
          handlers carry over from the previous one and the comparison is
          against a hybrid rather than the thing itself. */}
      <Hero key={variant} section={sections.hero} variant={variant} />

      <div className="section-tight">
        <div className="container-narrow">
          <p className="eyebrow">Preview</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Three heroes, one phone.
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Scroll the hero above, then switch. On a phone, B and C add depth
            that the shipped version has never had — every parallax effect in it
            is gated behind a mouse. C also lets you drag the photograph itself.
            Nothing here is live; the site is untouched until you pick one.
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-ink-950/95 backdrop-blur-xl">
        <div className="container-x flex flex-col gap-2 py-3">
          <div className="flex gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariant(v.id)}
                aria-pressed={v.id === variant}
                className={`min-h-11 flex-1 rounded-full px-3 text-[0.78rem] font-bold tracking-wide transition-colors ${
                  v.id === variant
                    ? 'bg-lumen-500 text-ink-950'
                    : 'border border-white/25 text-white/80 hover:border-white/50 hover:text-white'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
          <p className="text-center text-[0.72rem] leading-snug text-white/55">{active.note}</p>
        </div>
      </div>

      {/* The bar is fixed over the footer area; this keeps the last of the page
          reachable behind it. */}
      <div aria-hidden="true" className="h-28" />
    </>
  )
}

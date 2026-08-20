import { useCallback, useRef, useState } from 'react'
import Photo from './Photo'

/**
 * The signature interaction: drag the wipe between the chase open and the wall
 * finished. It is the product argument as a control — the customer sees the
 * thing they can never inspect again once the plaster is on.
 *
 * Keyboard-operable via a real range input; the visual handle is presentational.
 */
export default function BeforeAfter({
  beforeSrc, afterSrc, beforeDemoSrc, afterDemoSrc,
  beforeAlt, afterAlt, beforeBrief, afterBrief, ratio = '3 / 2',
}) {
  const [pos, setPos] = useState(50)
  const frameRef = useRef(null)
  const dragging = useRef(false)

  const setFromClientX = useCallback((clientX) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onPointerMove = (e) => { if (dragging.current) setFromClientX(e.clientX) }
  const onPointerUp = () => { dragging.current = false }

  return (
    <div className="group/ba">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative touch-none select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: ratio }}
      >
        <div className="absolute inset-0">
          <Photo src={afterSrc} demoSrc={afterDemoSrc} alt={afterAlt} brief={afterBrief} ratio={ratio} className="h-full w-full" />
        </div>

        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <Photo src={beforeSrc} demoSrc={beforeDemoSrc} alt={beforeAlt} brief={beforeBrief} ratio={ratio} className="h-full w-full" />
        </div>

        {/* The wipe reads as a chase edge, not a UI divider. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-500"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 shadow-[0_2px_10px_-2px_rgba(36,31,26,0.45)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-graphite-900)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10 7-5 5 5 5M14 7l5 5-5 5" />
            </svg>
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4 font-mono text-[0.7rem] uppercase tracking-wider">
          <span className="rounded bg-graphite-900/75 px-2 py-1 text-plaster-100">Chase open</span>
          <span className="rounded bg-graphite-900/75 px-2 py-1 text-plaster-100">Finished</span>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="sr-only">Reveal the wiring behind the finished wall</span>
        <input
          type="range" min="0" max="100" value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="ba-range w-full"
          aria-label="Reveal the wiring behind the finished wall"
        />
      </label>
    </div>
  )
}

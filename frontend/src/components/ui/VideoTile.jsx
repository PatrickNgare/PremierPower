import { useRef, useState } from 'react'
import { Play } from 'lucide-react'

/**
 * A short clip behind its own poster frame.
 *
 * Nothing but the poster loads until someone presses play — `preload="none"`
 * and no <source> until then. Nine clips at ~3MB each would otherwise be 24MB
 * downloaded by every visitor who scrolls past, on connections where that is
 * real money.
 *
 * Muted and playsInline so it can start on iOS without going fullscreen, and
 * because a page that makes noise unprompted is a page people close.
 */
export default function VideoTile({ src, poster, alt, label, className = '' }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef(null)

  const start = () => {
    setPlaying(true)
    // The element needs its source before it can play; give the browser a tick
    // to attach it.
    requestAnimationFrame(() => ref.current?.play().catch(() => { /* user can press again */ }))
  }

  return (
    <div className={`relative overflow-hidden rounded-[var(--radius-card)] bg-ink-950 ${className}`}>
      {playing ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          controls
          muted
          loop
          playsInline
          preload="none"
          className="h-full w-full object-cover"
        />
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label={`Play ${label || 'clip'}`}
          className="group block h-full w-full"
        >
          <img
            src={poster} alt={alt || ''} loading="lazy" decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center bg-ink-950/25 transition-colors duration-300 group-hover:bg-ink-950/15"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-raise transition-transform duration-300 group-hover:scale-110">
              <Play size={20} className="ml-0.5" />
            </span>
          </span>
          {label && (
            <span className="absolute bottom-3 left-3 rounded-full bg-ink-950/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {label}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

/**
 * Light / dark switch. One press, two states.
 *
 * The icon shows the theme you will get, not the one you are in — and the
 * label says so out loud, because an icon alone is ambiguous and every visitor
 * reads it the other way round at least once.
 *
 * Three dresses, one behaviour:
 *   pill — the public header, a bordered circle beside the phone control
 *   bare — the admin bar, matching the notification bell's chrome
 *   dark — for always-dark grounds, whatever the theme
 */
const SKINS = {
  pill: `h-11 w-11 rounded-full border border-line text-body-soft
         hover:border-[rgb(var(--accent-rgb))] hover:text-[rgb(var(--accent-rgb))] hover:-translate-y-0.5`,
  bare: `h-10 w-10 rounded-xl border border-transparent text-body-soft
         hover:bg-neutral-100 hover:text-body`,
  dark: `h-11 w-11 rounded-full border border-white/20 text-white/70
         hover:border-white/50 hover:text-white hover:-translate-y-0.5`,
}

export default function ThemeToggle({ variant = 'pill', className = '' }) {
  const { isDark, toggle } = useTheme()
  const next = isDark ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className={`relative flex shrink-0 items-center justify-center
        transition-all duration-300 ${SKINS[variant] ?? SKINS.pill} ${className}`}
    >
      {/* Both icons stay mounted and cross-fade, so the control never resizes
          or reflows the row it sits in mid-transition. */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? -55 : 0, scale: isDark ? 0.6 : 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <Moon size={16} />
      </motion.span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : 55, scale: isDark ? 1 : 0.6 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <Sun size={16} />
      </motion.span>
    </button>
  )
}

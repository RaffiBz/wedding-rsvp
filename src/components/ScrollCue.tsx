import { motion } from 'framer-motion'

/**
 * Subtle bouncing chevron hinting that the RSVP form is below the fold.
 * Clicking it smooth-scrolls to the form (same target as the RSVP CTA).
 */
export default function ScrollCue({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="scroll-cue"
      onClick={onClick}
      aria-label="Scroll to RSVP form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8 }}
    >
      <span className="scroll-cue__label">RSVP below</span>
      <motion.svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M6 9l6 6 6-6" />
      </motion.svg>
    </motion.button>
  )
}

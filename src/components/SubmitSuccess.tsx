import { motion, useReducedMotion } from 'framer-motion'
import type { Attending } from '../types'

interface SubmitSuccessProps {
  attending: Attending
  /** true when this was an update to an existing RSVP rather than a first response */
  edited: boolean
  /** Return to the form to make further changes. */
  onChange: () => void
}

export default function SubmitSuccess({ attending, edited, onChange }: SubmitSuccessProps) {
  const reduce = useReducedMotion()
  const yes = attending === 'Yes'

  const title = yes
    ? edited
      ? 'Your RSVP is updated'
      : "You're on the list"
    : "We'll miss you"

  const message = yes
    ? 'We can’t wait to celebrate with you under the stars.'
    : 'Thank you for letting us know — it means a lot.'

  return (
    <motion.div
      className="submit-success form-card"
      role="status"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div className={`success-mark ${yes ? '' : 'success-mark--soft'}`} aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2.4">
          <motion.circle
            cx="26"
            cy="26"
            r="23"
            initial={reduce ? false : { pathLength: 0 }}
            animate={reduce ? undefined : { pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
          {yes ? (
            <motion.path
              d="M15 27 l7 7 l15 -16"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
            />
          ) : (
            <motion.path
              d="M18 20 q8 9 16 0"
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={reduce ? undefined : { pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
            />
          )}
        </svg>
      </div>

      <h2 className="success-title">{title}</h2>
      <p className="success-msg">{message}</p>

      <button type="button" className="btn btn--ghost" onClick={onChange}>
        Change response
      </button>
    </motion.div>
  )
}

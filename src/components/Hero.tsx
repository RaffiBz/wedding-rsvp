import { motion, useReducedMotion, type Variants } from 'framer-motion'
import BirdGlass from './BirdGlass'
import ScrollCue from './ScrollCue'

interface HeroProps {
  /** Resolved party name, e.g. "The Melkonian Family". Optional greeting. */
  guestName?: string
  /** Smooth-scroll to the RSVP form (the only affordance to reach it). */
  onScrollToForm: () => void
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.2 },
  },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] },
  },
}

export default function Hero({ guestName, onScrollToForm }: HeroProps) {
  const reduce = useReducedMotion()
  // With reduced motion, render everything immediately (no stagger/transform).
  const variants = reduce ? undefined : rise

  return (
    <section className="hero">
      <motion.div
        className="hero__inner"
        variants={reduce ? undefined : container}
        initial={reduce ? false : 'hidden'}
        animate={reduce ? false : 'show'}
      >
        <motion.div variants={variants} className="hero__art">
          <BirdGlass className="bird-glass" />
        </motion.div>

        {guestName && (
          <motion.p variants={variants} className="hero__greeting label">
            Dear {guestName}
          </motion.p>
        )}

        <motion.p variants={variants} className="hero__welcome">
          We would like to welcome you to celebrate the union of
        </motion.p>

        <motion.h1 variants={variants} className="hero__names">
          Raffi <span className="hero__amp">&amp;</span> Nver
        </motion.h1>

        <motion.p variants={variants} className="hero__date label">
          Saturday 01 · 08 · 26
        </motion.p>

        <motion.div variants={variants} className="hero__details">
          <p className="hero__line">
            <span className="hero__line-label">Ceremony</span>
            Begins 2:30&nbsp;PM · 64 Komitas Ave, Yerevan
          </p>
          <p className="hero__line">
            <span className="hero__line-label">Reception to follow</span>
            Outdoor dinner under the stars, 6:00&nbsp;PM
            <br />
            Kotayk Region, Yeghvard · Aghasi Khanjyan Street 3
          </p>
        </motion.div>

      </motion.div>

      <ScrollCue onClick={onScrollToForm} />
    </section>
  )
}

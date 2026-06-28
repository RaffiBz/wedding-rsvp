import { motion, useReducedMotion, type Variants } from 'framer-motion'
import ScrollCue from './ScrollCue'
import birdCoupe from '../assets/bird-coupe.png'

interface HeroProps {
  /** Smooth-scroll to the RSVP form (the only affordance to reach it). */
  onScrollToForm: () => void
}

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.16, delayChildren: 0.2 },
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

export default function Hero({ onScrollToForm }: HeroProps) {
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
        <motion.p variants={variants} className="hero__welcome">
          We would like to welcome you to
          <br />
          celebrate the union of
        </motion.p>

        <motion.h1 variants={variants} className="hero__names">
          Raffi <span className="hero__amp">&amp;</span> Nver
        </motion.h1>

        <motion.div variants={variants} className="hero__when">
          <p className="hero__day">Saturday</p>
          <p className="hero__date">
            01<span className="hero__bar">|</span>08<span className="hero__bar">|</span>26
          </p>
        </motion.div>

        <motion.div variants={variants} className="hero__details">
          <p className="hero__block">
            Ceremony begins 2:30&nbsp;PM
            <br />
            64 Komitas Ave, Yerevan 0014, Armenia
          </p>
          <p className="hero__block">
            Reception to follow with an outdoor dinner
            <br />
            celebration under the stars
            <br />
            at 6:00&nbsp;PM
            <br />
            Kotayk Region, Yeghvard, Aghasi Khanjyan Street, 3
          </p>
        </motion.div>

        <motion.div variants={variants} className="hero__art">
          <span className="hero__rule hero__rule--l" aria-hidden="true" />
          <img className="hero__bird" src={birdCoupe} alt="" />
          <span className="hero__rule hero__rule--r" aria-hidden="true" />
        </motion.div>
      </motion.div>

      <ScrollCue onClick={onScrollToForm} />
    </section>
  )
}

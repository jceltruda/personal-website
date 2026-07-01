'use client';

import { motion, useReducedMotion } from 'motion/react';

// Framer-style scroll-triggered appear: elements start at near-zero opacity
// (0.001) and a small vertical offset, then spring to full opacity and their
// natural position over 1s with zero bounce. `once: true` means each section
// animates the first time it scrolls into view and never re-animates.
export default function Reveal({ children, className = '', delay = 0, offset = 30 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className || undefined}
      initial={{ opacity: 0.001, y: reduceMotion ? 0 : offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ type: 'spring', bounce: 0, duration: 1, delay }}
    >
      {children}
    </motion.div>
  );
}

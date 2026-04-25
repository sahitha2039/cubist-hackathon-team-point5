'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

export default function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const travelY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [72, -44]);
  const rotate = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-6, 8]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduceMotion ? [1, 1, 1] : [0.96, 1.02, 0.98]);
  const haloY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [30, -22]);

  return (
    <div
      ref={ref}
      className="relative mx-auto flex min-h-[460px] w-full max-w-[640px] items-center justify-center lg:min-h-[620px]"
    >
      <div className="council-hero-beam absolute inset-x-0 top-8 h-[80%]" aria-hidden />
      <motion.div
        style={{ y: haloY }}
        className="pointer-events-none absolute inset-6 rounded-[2rem] border border-[rgba(32,24,20,0.12)]"
        aria-hidden
      />
      <motion.div
        style={{ y: travelY, rotate, scale }}
        className="relative z-10 w-full max-w-[540px]"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="absolute inset-x-16 bottom-6 h-20 rounded-full bg-[rgba(201,127,139,0.26)] blur-3xl" aria-hidden />
          <svg
            viewBox="0 0 480 620"
            role="img"
            aria-label="Grandmaster Council chess king"
            className="h-auto w-full drop-shadow-[0_30px_70px_rgba(32,24,20,0.22)]"
          >
            <defs>
              <linearGradient id="kingMain" x1="110" y1="90" x2="350" y2="520" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff7ea" />
                <stop offset="0.26" stopColor="#efd6ae" />
                <stop offset="0.6" stopColor="#c46a55" />
                <stop offset="1" stopColor="#201814" />
              </linearGradient>
              <linearGradient id="kingEdge" x1="140" y1="110" x2="320" y2="500" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff7ea" stopOpacity="0.94" />
                <stop offset="1" stopColor="#c97f8b" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="platform" x1="104" y1="430" x2="360" y2="560" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff3dd" />
                <stop offset="0.4" stopColor="#be8b3d" />
                <stop offset="1" stopColor="#2b201b" />
              </linearGradient>
              <radialGradient
                id="halo"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(236 180) rotate(90) scale(240 220)"
              >
                <stop stopColor="#fff3dd" stopOpacity="0.82" />
                <stop offset="0.48" stopColor="#c46a55" stopOpacity="0.18" />
                <stop offset="1" stopColor="#c46a55" stopOpacity="0" />
              </radialGradient>
              <filter id="softShadow" x="0" y="0" width="480" height="620" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="28" stdDeviation="24" floodColor="#201814" floodOpacity="0.24" />
              </filter>
            </defs>

            <g filter="url(#softShadow)">
              <ellipse cx="240" cy="240" rx="184" ry="188" fill="url(#halo)" />
              <path
                d="M236 62c16 0 29 13 29 29v18h18c12 0 21 9 21 21 0 11-9 20-21 20h-18v24c0 16-13 29-29 29s-29-13-29-29v-24h-18c-12 0-21-9-21-20 0-12 9-21 21-21h18V91c0-16 13-29 29-29Z"
                fill="url(#kingMain)"
              />
              <circle cx="236" cy="214" r="44" fill="url(#kingMain)" />
              <path
                d="M177 244c16-24 37-36 59-36s43 12 59 36l23 118c8 39-17 72-58 79h-48c-41-7-66-40-58-79l23-118Z"
                fill="url(#kingMain)"
              />
              <path
                d="M166 302c14-16 36-24 70-24s56 8 70 24l11 54c5 24-8 46-32 56l-18 8H205l-18-8c-24-10-37-32-32-56l11-54Z"
                fill="#201814"
                opacity="0.2"
              />
              <rect x="174" y="430" width="124" height="32" rx="16" fill="url(#platform)" />
              <path d="M132 476c7-20 28-30 60-30h88c32 0 53 10 60 30l16 48H116l16-48Z" fill="url(#platform)" />
              <rect x="98" y="522" width="276" height="38" rx="19" fill="url(#platform)" />
              <ellipse cx="236" cy="565" rx="154" ry="22" fill="#201814" opacity="0.42" />
              <path
                d="M212 94h16m8 47c16 0 29 13 29 29m-126 195c18-26 45-39 81-39m-31-94c11-10 27-15 47-15m-14 294h108"
                stroke="url(#kingEdge)"
                strokeLinecap="round"
                strokeWidth="10"
                opacity="0.78"
              />
              <circle cx="236" cy="214" r="12" fill="#fff7ea" opacity="0.9" />
            </g>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: haloY }}
        className="pointer-events-none absolute right-4 top-10 hidden rounded-full border border-[rgba(32,24,20,0.12)] bg-[rgba(255,248,237,0.78)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(32,24,20,0.66)] backdrop-blur md:block"
      >
        Replaceable hero asset
      </motion.div>
      <motion.div
        style={{ y: travelY }}
        className="pointer-events-none absolute bottom-8 left-0 hidden rounded-full border border-[rgba(32,24,20,0.12)] bg-[rgba(43,32,27,0.9)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[rgba(255,247,234,0.72)] backdrop-blur md:block"
      >
        Council piece in motion
      </motion.div>
    </div>
  );
}

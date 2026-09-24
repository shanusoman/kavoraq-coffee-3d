import { SITE } from '../data/site'
import { useId } from 'react'

/**
 * Generated editorial artwork for the gallery (and WebGL fallback).
 * Replace with photography by setting `image` in data/gallery.js.
 */
const Bean = ({ x, y, r = 0, s = 1, fill, crease = '#1a0d06' }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <ellipse rx="30" ry="44" fill={fill} />
    <ellipse rx="30" ry="44" fill="url(#beanShade)" />
    <path d="M-4-40c16 16-12 40 5 80" stroke={crease} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
  </g>
)

export default function CoffeeArt({ kind }) {
  const uid = useId().replace(/:/g, '')
  const g = (n) => `${n}-${uid}`
  return (
    <svg className="art" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label={kind}>
      <defs>
        <radialGradient id="beanShade" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id={g('glow')} cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor="#5a341d" />
          <stop offset="1" stopColor="#0b0705" />
        </radialGradient>
        <radialGradient id={g('fire')} cx="0.5" cy="0.9" r="0.7">
          <stop offset="0" stopColor="#ff8a3a" stopOpacity="0.9" />
          <stop offset="0.4" stopColor="#8a3a12" stopOpacity="0.5" />
          <stop offset="1" stopColor="#0b0705" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={g('crema')} cx="0.46" cy="0.44" r="0.55">
          <stop offset="0" stopColor="#d59d62" />
          <stop offset="0.55" stopColor="#a4652f" />
          <stop offset="0.9" stopColor="#5e3116" />
          <stop offset="1" stopColor="#3a1c0c" />
        </radialGradient>
        <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3b98a" />
          <stop offset="0.5" stopColor="#8d6446" />
          <stop offset="1" stopColor="#1b140e" />
        </linearGradient>
        <filter id={g('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.8  0 0 0 0 0.7  0 0 0 0.12 0" />
        </filter>
        <filter id={g('soft')}><feGaussianBlur stdDeviation="18" /></filter>
        <filter id={g('grounds')}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 0 0.03  0 0 0 2.2 -0.6" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {kind === 'beans' && (
        <>
          <rect width="800" height="1000" fill="#12100b" />
          <rect width="800" height="1000" fill={`url(#${g('glow')})`} opacity="0.5" />
          {BEAN_FIELD.map((b, i) => (
            <Bean key={i} {...b} fill={['#8d9a68', '#9aa574', '#7f8c5d', '#a4a97a'][i % 4]} crease="#4b5332" />
          ))}
        </>
      )}

      {kind === 'roast' && (
        <>
          <rect width="800" height="1000" fill="#0b0705" />
          <rect width="800" height="1000" fill={`url(#${g('fire')})`} />
          <circle cx="400" cy="470" r="300" fill="#16110e" stroke="#b8743f" strokeWidth="14" />
          <circle cx="400" cy="470" r="270" fill="#0d0907" />
          {BEAN_FIELD.slice(0, 26).map((b, i) => (
            <Bean key={i} x={220 + (i % 7) * 58 + (i % 2) * 20} y={560 + Math.floor(i / 7) * 42 - Math.abs(3 - (i % 7)) * 18} r={b.r} s={0.75}
              fill={['#5c321a', '#4a2814', '#6b3b1e'][i % 3]} />
          ))}
          <rect x="120" y="880" width="560" height="10" fill="#ff7a2a" filter={`url(#${g('soft')})`} opacity="0.9" />
        </>
      )}

      {kind === 'grind' && (
        <>
          <rect width="800" height="1000" fill="#0e0907" />
          <ellipse cx="400" cy="420" rx="340" ry="260" fill="#c8925a" opacity="0.08" filter={`url(#${g('soft')})`} />
          <path d="M40 1000C120 700 280 560 400 540s290 150 360 460z" fill="#2b170c" />
          <path d="M40 1000C120 700 280 560 400 540s290 150 360 460z" fill="#fff" filter={`url(#${g('grounds')})`} />
          <path d="M400 0v520" stroke="#3a2112" strokeWidth="18" strokeDasharray="2 10" opacity="0.8" />
        </>
      )}

      {kind === 'brew' && (
        <>
          <rect width="800" height="1000" fill="#110b08" />
          <rect width="800" height="1000" fill={`url(#${g('glow')})`} opacity="0.6" />
          <path d="M200 330h400L440 620h-80z" fill="#eee4d6" />
          <path d="M200 330h400l-30 34H230z" fill="#fff" opacity="0.4" />
          <path d="M250 780c0-60 40-120 150-120s150 60 150 120v140H250z" fill="#fff" opacity="0.12" stroke="#fff" strokeOpacity="0.25" />
          <path d="M262 820c20-10 80-20 138-20s118 10 138 20v100H262z" fill="#2a1209" />
          <path d="M400 620v180" stroke="#4a220d" strokeWidth="4" />
          <path d="M140 60c90 20 180 120 230 280" stroke="#fff3e2" strokeWidth="5" fill="none" opacity="0.8" />
          <path d="M360 250c-30-60 40-90 10-150M430 260c-20-50 30-80 5-130" stroke="#fff" strokeWidth="18" fill="none" opacity="0.08" filter={`url(#${g('soft')})`} />
        </>
      )}

      {kind === 'farm' && (
        <>
          <rect width="800" height="1000" fill={`url(#${g('sky')})`} />
          <circle cx="560" cy="300" r="70" fill="#ffe2b8" opacity="0.85" />
          <path d="M0 520c140-80 260-120 400-60s280 20 400-40v580H0z" fill="#5b5a3e" opacity="0.7" />
          <path d="M0 620c160-90 300-60 420 0s260 40 380-20v400H0z" fill="#3e452b" />
          <path d="M0 740c120-60 300-80 460-10s240 30 340 0v270H0z" fill="#27301d" />
          {Array.from({ length: 9 }, (_, r) => (
            <path key={r} d={`M-20 ${780 + r * 26}q420 ${-60 + r * 4} 840 -10`} stroke="#4f5e36" strokeWidth="8" fill="none" opacity={0.5 - r * 0.03} strokeLinecap="round" strokeDasharray="14 12" />
          ))}
          <rect width="800" height="1000" fill="#e8c9a0" opacity="0.08" />
        </>
      )}

      {kind === 'cup' && (
        <>
          <rect width="800" height="1000" fill="#150e0a" />
          <ellipse cx="420" cy="530" rx="330" ry="330" fill="#000" opacity="0.4" filter={`url(#${g('soft')})`} />
          <circle cx="400" cy="500" r="320" fill="#efe7db" />
          <circle cx="400" cy="500" r="300" fill="#e2d7c7" />
          <circle cx="400" cy="500" r="200" fill="#f4ede3" />
          <circle cx="400" cy="500" r="176" fill={`url(#${g('crema')})`} />
          <path d="M400 380c-40 30-50 80-10 120s30 70 0 100" stroke="#e8c092" strokeWidth="10" fill="none" opacity="0.55" strokeLinecap="round" />
          <path d="M590 470c60-10 80 50 30 70" stroke="#efe7db" strokeWidth="26" fill="none" strokeLinecap="round" />
          <Bean x={160} y={860} r={-30} s={0.8} fill="#4a2814" />
          <Bean x={650} y={170} r={40} s={0.7} fill="#5c321a" />
        </>
      )}

      {kind === 'packaging' && (
        <>
          <rect width="800" height="1000" fill="#1b120d" />
          <rect y="700" width="800" height="300" fill="#2a1a11" />
          <path d="M220 240c0-12 8-20 20-20h320c12 0 20 8 20 20l24 480H196z" fill="#6b3a1f" />
          <path d="M220 240c0-12 8-20 20-20h320c12 0 20 8 20 20l24 480H196z" fill="url(#beanShade)" opacity="0.5" />
          <rect x="290" y="380" width="220" height="250" fill="#efe2cc" />
          <text x="400" y="440" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="48" letterSpacing="10" fill="#2a170c" textLength="196" lengthAdjust="spacingAndGlyphs">{SITE.brand.toUpperCase()}</text>
          <line x1="330" x2="470" y1="470" y2="470" stroke="#2a170c" opacity="0.4" />
          <text x="400" y="540" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="40" fill="#2a170c">Signature</text>
          <Bean x={640} y={760} r={20} s={0.9} fill="#4a2814" />
          <Bean x={700} y={800} r={-50} s={0.8} fill="#5c321a" />
          <Bean x={130} y={790} r={70} s={0.85} fill="#3b2012" />
        </>
      )}

      <rect width="800" height="1000" filter={`url(#${g('grain')})`} />
    </svg>
  )
}

const BEAN_FIELD = Array.from({ length: 34 }, (_, i) => {
  const col = i % 6
  const row = Math.floor(i / 6)
  return {
    x: 70 + col * 132 + (row % 2) * 60 + Math.sin(i * 7.1) * 20,
    y: 80 + row * 160 + Math.cos(i * 3.3) * 30,
    r: Math.sin(i * 12.9) * 70,
    s: 1.1 + Math.sin(i * 5.7) * 0.25,
  }
})

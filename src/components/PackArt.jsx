import { SITE } from '../data/site'
import { useId } from 'react'

/** Generated product packaging: a stand-up pouch, or a bottle for cold brew. */
export default function PackArt({ product }) {
  const uid = useId().replace(/:/g, '')
  const { bag, label, ink } = product.palette
  const bottle = product.id === 'cold-brew'
  return (
    <svg className="pack" viewBox="0 0 400 520" role="img" aria-label={`${product.name} packaging`}>
      <defs>
        <linearGradient id={`shade-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.18" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.32" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`floor-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.09 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <ellipse cx="200" cy="492" rx="150" ry="16" fill={`url(#floor-${uid})`} />
      {bottle ? (
        <g className="pack__body">
          <path d="M168 40h64v46c0 18 44 36 44 84v290c0 18-12 30-30 30h-92c-18 0-30-12-30-30V170c0-48 44-66 44-84z" fill={bag} />
          <rect x="164" y="22" width="72" height="30" rx="6" fill={label} />
          <path d="M168 40h64v46c0 18 44 36 44 84v290c0 18-12 30-30 30h-92c-18 0-30-12-30-30V170c0-48 44-66 44-84z" fill={`url(#shade-${uid})`} />
          <rect x="136" y="230" width="128" height="170" fill={label} />
          <text x="200" y="272" textAnchor="middle" className="pack__brand" fill={bag}>{SITE.brand}</text>
          <line x1="160" x2="240" y1="288" y2="288" stroke={bag} strokeOpacity="0.4" />
          <text x="200" y="324" textAnchor="middle" className="pack__name" fill={bag}>Cold</text>
          <text x="200" y="352" textAnchor="middle" className="pack__name" fill={bag}>Brew</text>
          <text x="200" y="384" textAnchor="middle" className="pack__meta" fill={bag}>{product.weight}</text>
        </g>
      ) : (
        <g className="pack__body">
          <path d="M96 60c0-10 6-16 16-16h176c10 0 16 6 16 16l14 400c0 12-8 20-20 20H102c-12 0-20-8-20-20z" fill={bag} />
          <path d="M96 60c0-10 6-16 16-16h176c10 0 16 6 16 16l14 400c0 12-8 20-20 20H102c-12 0-20-8-20-20z" fill={`url(#shade-${uid})`} />
          <path d="M96 60c0-10 6-16 16-16h176c10 0 16 6 16 16l14 400c0 12-8 20-20 20H102c-12 0-20-8-20-20z" filter={`url(#grain-${uid})`} />
          {Array.from({ length: 22 }, (_, i) => (
            <line key={i} x1={104 + i * 9} x2={104 + i * 9} y1="52" y2="70" stroke="#000" strokeOpacity="0.22" />
          ))}
          <circle cx="200" cy="108" r="9" fill="none" stroke={ink} strokeOpacity="0.35" />
          <rect x="124" y="170" width="152" height="230" fill={label} />
          <text x="200" y="214" textAnchor="middle" className="pack__brand" fill={bag}>{SITE.brand}</text>
          <text x="200" y="232" textAnchor="middle" className="pack__meta" fill={bag}>COFFEE • CRAFT • MOMENT</text>
          <g transform="translate(200 280) rotate(-24)">
            <ellipse rx="15" ry="22" fill={bag} />
            <path d="M-3-20c9 9-7 22 3 40" stroke={label} strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
          {product.name.split(' ').map((w, i, arr) => (
            <text key={w} x="200" y={338 + i * 26 - (arr.length - 1) * 8} textAnchor="middle" className="pack__name" fill={bag}>{w}</text>
          ))}
          <text x="200" y="388" textAnchor="middle" className="pack__meta" fill={bag}>{product.roast.toUpperCase()} · {product.weight}</text>
          <text x="200" y="450" textAnchor="middle" className="pack__meta" fill={ink} fillOpacity="0.6">WHOLE BEAN</text>
        </g>
      )}
    </svg>
  )
}

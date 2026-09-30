import { Skin } from '../game/data'

interface Props {
  skin: Skin
  size?: number
  anim?: boolean
}

export default function DanyaAvatar({ skin, size, anim }: Props) {
  const s = size || 120
  const c = skin.colors
  const gid = 'g-' + skin.id
  const acc = skin.accessory

  return (
    <svg viewBox="0 0 100 100" width={s} height={s} className={'avatar' + (anim ? ' avatar-anim' : '')} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </radialGradient>
        <linearGradient id={gid + '-hair'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.hair} />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill={'url(#' + gid + ')'} />
      <circle cx="50" cy="50" r="46" fill="none" stroke={c.glow} strokeWidth="2" opacity="0.85" />

      <ellipse cx="50" cy="56" rx="24" ry="26" fill={c.face} />
      <path d="M26 46 Q26 22 50 22 Q74 22 74 46 Q68 32 50 33 Q32 32 26 46 Z" fill={'url(#' + gid + '-hair)'} />
      <ellipse cx="30" cy="56" rx="4" ry="5" fill={c.face} />
      <ellipse cx="70" cy="56" rx="4" ry="5" fill={c.face} />

      <ellipse cx="41" cy="52" rx="5.2" ry={acc === 'mask' ? 4 : 6} fill="#fff" />
      <ellipse cx="59" cy="52" rx="5.2" ry={acc === 'mask' ? 4 : 6} fill="#fff" />
      <circle cx="42" cy="53" r="2.6" fill={c.eye} />
      <circle cx="60" cy="53" r="2.6" fill={c.eye} />
      <circle cx="42.9" cy="52.1" r="1" fill="#fff" />
      <circle cx="60.9" cy="52.1" r="1" fill="#fff" />

      <path d="M40 68 Q50 76 60 68" stroke="#7a2b3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="62" rx="2" ry="1.4" fill={c.accent} opacity="0.7" />

      {acc === 'crown' && (
        <g>
          <path d="M30 24 L36 12 L44 21 L50 8 L56 21 L64 12 L70 24 Z" fill="#fde047" stroke="#b45309" strokeWidth="1.4" />
          <circle cx="50" cy="16" r="2.2" fill="#ef4444" />
        </g>
      )}
      {acc === 'horns' && (
        <g>
          <path d="M28 30 Q18 20 22 8 Q32 14 34 26 Z" fill="#1c1917" stroke="#7f1d1d" strokeWidth="1.2" />
          <path d="M72 30 Q82 20 78 8 Q68 14 66 26 Z" fill="#1c1917" stroke="#7f1d1d" strokeWidth="1.2" />
        </g>
      )}
      {acc === 'visor' && (
        <rect x="29" y="44" width="42" height="12" rx="5" fill="#0ea5e9" opacity="0.85" stroke="#e0f2fe" strokeWidth="1.2" />
      )}
      {acc === 'mask' && (
        <g>
          <path d="M28 44 Q50 36 72 44 L72 62 Q50 74 28 62 Z" fill="#0b0b0f" opacity="0.9" />
          <path d="M34 52 L46 56 L34 60 Z" fill="#c8ff2e" />
          <path d="M66 52 L54 56 L66 60 Z" fill="#c8ff2e" />
        </g>
      )}
      {acc === 'diamond' && (
        <g>
          <path d="M50 4 L62 18 L50 32 L38 18 Z" fill="#a5f3fc" stroke="#0891b2" strokeWidth="1.4" />
          <path d="M38 18 L50 4 L62 18 L50 32 Z" fill="none" stroke="#fff" strokeWidth="0.7" opacity="0.8" />
        </g>
      )}
      {acc === 'cap' && (
        <g>
          <path d="M24 34 Q50 14 76 34 L76 38 L24 38 Z" fill="#1f6feb" />
          <rect x="22" y="36" width="34" height="5" rx="2.5" fill="#0b2545" />
        </g>
      )}
    </svg>
  )
}

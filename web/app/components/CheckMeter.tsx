/**
 * CheckMeter — Editorial check result card.
 * Shows: icon, check name, progress bar, detail text.
 * Used on the stock detail page.
 */

import type { CheckResult } from '@/lib/types'

const LIGHT_CFG = {
  GREEN: {
    color:    '#047857',
    bg:       '#D1FAE5',
    border:   'rgba(4,120,87,0.2)',
    track:    'rgba(4,120,87,0.12)',
    fill:     1.0,
    iconPath: 'M20 6 9 17l-5-5',
  },
  YELLOW: {
    color:    '#92400E',
    bg:       '#FEF3C7',
    border:   'rgba(146,64,14,0.2)',
    track:    'rgba(217,119,6,0.12)',
    fill:     0.5,
    iconPath: 'M12 9v4M12 17h.01',
  },
  RED: {
    color:    '#991B1B',
    bg:       '#FEE2E2',
    border:   'rgba(153,27,27,0.2)',
    track:    'rgba(220,38,38,0.10)',
    fill:     0.15,
    iconPath: 'M18 6 6 18M6 6l12 12',
  },
}

const ICON_STROKE = {
  GREEN:  '#047857',
  YELLOW: '#D97706',
  RED:    '#DC2626',
}

interface Props {
  check: CheckResult
  delay?: number
}

export default function CheckMeter({ check, delay = 0 }: Props) {
  const cfg   = LIGHT_CFG[check.light]
  const stroke = ICON_STROKE[check.light]
  const pct   = cfg.fill * 100

  return (
    <div
      className="animate-fade-up rounded-lg p-3.5 flex flex-col gap-2.5"
      style={{
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: `${stroke}20`, border: `1px solid ${stroke}30` }}
        >
          <svg
            width="10" height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={cfg.iconPath} />
          </svg>
        </span>
        <span
          className="text-xs font-semibold leading-snug flex-1"
          style={{ color: '#111827', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
        >
          {check.name}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: cfg.track }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full animate-slide-right"
          style={{
            width:          `${pct}%`,
            background:     stroke,
            animationDelay: `${delay + 0.1}s`,
          }}
        />
      </div>

      {/* Detail text */}
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: '#6B7280', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
      >
        {check.detail}
      </p>
    </div>
  )
}

/**
 * ScoreGauge — Editorial score display.
 *
 * hero  → large Playfair Display serif number (editorial style, like prototype B)
 * table → compact SVG arc ring (48px)
 * badge → tiny SVG arc ring (32px)
 *
 * Score range: -17 (all RED+SELL+LOW) to +25 (all GREEN+BUY+HIGH)
 */

import type { Signal } from '@/lib/types'

const MIN_SCORE = -17
const MAX_SCORE = 25
const SCORE_RANGE = MAX_SCORE - MIN_SCORE

type GaugeSize = 'hero' | 'table' | 'badge'

interface Props {
  score:    number
  signal:   Signal
  size?:    GaugeSize
  animate?: boolean
}

const SIGNAL_COLOR: Record<Signal, string> = {
  BUY:  '#047857',
  HOLD: '#92400E',
  SELL: '#991B1B',
}

// For SVG arc track (table/badge)
const ARC_STROKE: Record<Signal, string> = {
  BUY:  '#059669',
  HOLD: '#D97706',
  SELL: '#DC2626',
}

export default function ScoreGauge({ score, signal, size = 'hero', animate = true }: Props) {
  const textColor = SIGNAL_COLOR[signal]

  /* ── Hero: large editorial serif number ── */
  if (size === 'hero') {
    return (
      <div
        className="flex flex-col items-center lg:items-start"
        role="img"
        aria-label={`Score ${score} out of 25 — ${signal}`}
      >
        <span
          style={{
            fontFamily:   'var(--font-serif), "Playfair Display", Georgia, serif',
            fontSize:     '80px',
            fontWeight:   700,
            lineHeight:   1,
            color:        textColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </span>
        <span
          style={{
            fontFamily:  'var(--font-sans), Inter, sans-serif',
            fontSize:    '11px',
            fontWeight:  500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:       '#9CA3AF',
            marginTop:   '2px',
          }}
        >
          out of 25
        </span>
      </div>
    )
  }

  /* ── Table / Badge: SVG arc ring ── */
  const cfg = size === 'table'
    ? { px: 48, r: 18, strokeWidth: 4, fontSize: 10 }
    : { px: 32, r: 12, strokeWidth: 3, fontSize: 8  }

  const cx           = cfg.px / 2
  const cy           = cfg.px / 2
  const circumference = 2 * Math.PI * cfg.r
  const arcLength    = circumference * 0.75
  const pct          = Math.max(0, Math.min(1, (score - MIN_SCORE) / SCORE_RANGE))
  const dashOffset   = arcLength - arcLength * pct
  const strokeColor  = ARC_STROKE[signal]

  return (
    <div
      className="relative shrink-0"
      style={{ width: cfg.px, height: cfg.px }}
      role="img"
      aria-label={`Score ${score} — ${signal}`}
    >
      <svg width={cfg.px} height={cfg.px} viewBox={`0 0 ${cfg.px} ${cfg.px}`} aria-hidden="true">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={cfg.r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-225deg)', transformOrigin: '50% 50%' }}
        />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={cfg.r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-225deg)',
            transformOrigin: '50% 50%',
            transition: animate ? 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          style={{
            fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
            fontSize:   cfg.fontSize,
            fontWeight: 600,
            color:      textColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}

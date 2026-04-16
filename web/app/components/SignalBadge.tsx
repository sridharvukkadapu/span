import type { Signal } from '@/lib/types'

const SIGNAL_CFG: Record<Signal, { bg: string; text: string; border: string }> = {
  BUY: {
    bg:     '#D1FAE5',
    text:   '#047857',
    border: 'rgba(4,120,87,0.25)',
  },
  HOLD: {
    bg:     '#FEF3C7',
    text:   '#92400E',
    border: 'rgba(146,64,14,0.25)',
  },
  SELL: {
    bg:     '#FEE2E2',
    text:   '#991B1B',
    border: 'rgba(153,27,27,0.25)',
  },
}

const SIZE: Record<string, string> = {
  sm: 'px-2.5 py-0.5 text-[10px] tracking-[0.08em]',
  md: 'px-3 py-1 text-[11px] tracking-[0.08em]',
  lg: 'px-4 py-1.5 text-[13px] tracking-[0.06em]',
}

export default function SignalBadge({
  signal,
  size    = 'lg',
  variant = 'tinted',
}: {
  signal:   Signal
  size?:    'sm' | 'md' | 'lg'
  variant?: 'tinted' | 'filled'
}) {
  const c = SIGNAL_CFG[signal]
  const isFilled = variant === 'filled'

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase rounded-full ${SIZE[size]}`}
      style={{
        background:  isFilled ? c.text : c.bg,
        color:       isFilled ? '#FFFFFF' : c.text,
        border:      `1px solid ${isFilled ? c.text : c.border}`,
        fontFamily:  'var(--font-sans), Inter, sans-serif',
        letterSpacing: '0.08em',
      }}
    >
      {signal}
    </span>
  )
}

import type { Signal } from '@/lib/types'

const config: Record<Signal, { bg: string; text: string; border: string; glow?: string }> = {
  BUY: {
    bg:     'rgba(16,185,129,0.10)',
    text:   '#34d399',
    border: 'rgba(16,185,129,0.25)',
    glow:   '0 0 20px rgba(16,185,129,0.15)',
  },
  SELL: {
    bg:     'rgba(239,68,68,0.10)',
    text:   '#f87171',
    border: 'rgba(239,68,68,0.25)',
    glow:   '0 0 20px rgba(239,68,68,0.12)',
  },
  HOLD: {
    bg:     'rgba(245,158,11,0.10)',
    text:   '#fbbf24',
    border: 'rgba(245,158,11,0.22)',
  },
}

const sizeClass = {
  sm: 'px-2.5 py-0.5 text-[10px] tracking-[1.5px] rounded-md',
  md: 'px-4 py-1 text-xs tracking-[2px] rounded-md',
  lg: 'px-10 py-3.5 text-2xl tracking-[6px] rounded-xl',
}

export default function SignalBadge({
  signal,
  size = 'lg',
}: {
  signal: Signal
  size?: 'sm' | 'md' | 'lg'
}) {
  const c = config[signal]
  return (
    <span
      className={`inline-block font-mono font-bold ${sizeClass[size]}`}
      style={{
        background:  c.bg,
        color:       c.text,
        border:      `1px solid ${c.border}`,
        boxShadow:   c.glow ?? 'none',
      }}
    >
      {signal}
    </span>
  )
}

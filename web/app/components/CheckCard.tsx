import type { CheckResult } from '@/lib/types'

const config = {
  GREEN: {
    accent: '#059669',
    bg:     'rgba(5,150,105,0.07)',
    border: 'rgba(5,150,105,0.16)',
    icon:   'M20 6 9 17l-5-5',
  },
  YELLOW: {
    accent: '#D97706',
    bg:     'rgba(217,119,6,0.07)',
    border: 'rgba(217,119,6,0.16)',
    icon:   'M12 9v4M12 17h.01',
  },
  RED: {
    accent: '#DC2626',
    bg:     'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.14)',
    icon:   'M18 6 6 18M6 6l12 12',
  },
}

export default function CheckCard({ check }: { check: CheckResult }) {
  const c = config[check.light]
  return (
    <div
      className="flex flex-col gap-2 p-3.5 rounded-lg"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          style={{ background: `${c.accent}18`, border: `1px solid ${c.accent}30` }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={c.icon}/>
          </svg>
        </span>
        <span className="text-xs font-semibold leading-snug" style={{ color: '#0D0D0B' }}>{check.name}</span>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: '#6A6A68' }}>{check.detail}</p>
    </div>
  )
}

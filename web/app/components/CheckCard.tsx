import type { CheckResult } from '@/lib/types'

const config = {
  GREEN: {
    icon:   '✓',
    accent: '#10b981',
    bg:     'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.18)',
    bar:    '#10b981',
  },
  YELLOW: {
    icon:   '◐',
    accent: '#f59e0b',
    bg:     'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.18)',
    bar:    '#f59e0b',
  },
  RED: {
    icon:   '✕',
    accent: '#ef4444',
    bg:     'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.16)',
    bar:    '#ef4444',
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
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
          style={{ background: `${c.accent}22`, color: c.accent }}
        >
          {c.icon}
        </span>
        <span className="text-xs font-semibold text-white leading-snug">{check.name}</span>
      </div>
      <p className="text-[11px] text-fog leading-relaxed">{check.detail}</p>
    </div>
  )
}

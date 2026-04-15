import type { CheckResult } from '@/lib/types'

const styles = {
  GREEN:  { bg: 'rgba(16,185,129,0.08)',  text: '#34d399', border: 'rgba(16,185,129,0.20)', icon: '✓' },
  YELLOW: { bg: 'rgba(245,158,11,0.08)',  text: '#fbbf24', border: 'rgba(245,158,11,0.20)', icon: '◐' },
  RED:    { bg: 'rgba(239,68,68,0.07)',   text: '#f87171', border: 'rgba(239,68,68,0.18)',  icon: '✕' },
}

export default function CheckPill({ check }: { check: CheckResult }) {
  const s = styles[check.light]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className="text-[10px] font-bold">{s.icon}</span>
      {check.name}
    </span>
  )
}

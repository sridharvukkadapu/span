import type { CheckResult } from '@/lib/types'

const styles = {
  GREEN:  { bg: 'rgba(5,150,105,0.08)',  text: '#047857', border: 'rgba(5,150,105,0.20)'  },
  YELLOW: { bg: 'rgba(217,119,6,0.08)', text: '#B45309', border: 'rgba(217,119,6,0.20)' },
  RED:    { bg: 'rgba(220,38,38,0.07)', text: '#B91C1C', border: 'rgba(220,38,38,0.18)'  },
}

export default function CheckPill({ check }: { check: CheckResult }) {
  const s = styles[check.light]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold num"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {check.name}
    </span>
  )
}

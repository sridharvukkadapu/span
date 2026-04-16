interface MetricCardProps {
  label: string
  value: string | null | undefined
  highlight?: boolean
  positive?: boolean
  negative?: boolean
  size?: 'sm' | 'md'
}

export default function MetricCard({
  label,
  value,
  highlight,
  positive,
  negative,
  size = 'md',
}: MetricCardProps) {
  const valueColor =
    positive  ? '#047857' :
    negative  ? '#B91C1C' :
    highlight ? '#0D0D0B' :
    '#2A2A28'

  return (
    <div
      className="rounded-lg px-4 py-3 flex flex-col gap-1"
      style={{
        background: positive ? 'rgba(5,150,105,0.05)' : negative ? 'rgba(220,38,38,0.04)' : 'rgba(13,13,11,0.03)',
        border: positive ? '1px solid rgba(5,150,105,0.14)' : negative ? '1px solid rgba(220,38,38,0.12)' : '1px solid rgba(13,13,11,0.07)',
      }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-[0.1em]"
        style={{ color: '#9A9A98', fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </div>
      <div
        className={`num tabular-nums leading-none font-bold ${size === 'sm' ? 'text-base' : 'text-xl'}`}
        style={{ color: valueColor }}
      >
        {value ?? <span className="text-sm" style={{ color: '#C0C0BE' }}>—</span>}
      </div>
    </div>
  )
}

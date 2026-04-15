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
    positive ? '#34d399' :
    negative ? '#f87171' :
    highlight ? '#93c5fd' :
    '#e2e8f0'

  return (
    <div
      className="rounded-lg px-4 py-3 flex flex-col gap-1"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] font-body">
        {label}
      </div>
      <div
        className={`font-mono tabular-nums leading-none font-bold ${
          size === 'sm' ? 'text-base' : 'text-xl'
        }`}
        style={{ color: valueColor }}
      >
        {value ?? <span className="text-smoke text-sm">—</span>}
      </div>
    </div>
  )
}

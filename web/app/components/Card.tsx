import type { ReactNode } from 'react'

interface CardProps {
  title: string
  icon?: ReactNode
  badge?: string
  children: ReactNode
  className?: string
  accent?: 'green' | 'blue' | 'amber' | 'red'
}

const accentMap = {
  green: 'rgba(16,185,129,0.06)',
  blue:  'rgba(59,130,246,0.05)',
  amber: 'rgba(245,158,11,0.05)',
  red:   'rgba(239,68,68,0.05)',
}

export default function Card({ title, icon, badge, children, className = '', accent }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/[0.07] bg-surface shadow-inner ${className}`}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        background: accent ? `linear-gradient(180deg, ${accentMap[accent]} 0%, #0a1221 60%)` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-mist uppercase tracking-[0.08em]">
          {icon && <span className="opacity-60">{icon}</span>}
          {title}
        </h2>
        {badge && (
          <span className="tag font-mono text-smoke" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  )
}

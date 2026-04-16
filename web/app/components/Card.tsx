import type { ReactNode } from 'react'

interface CardProps {
  title: string
  icon?: ReactNode
  badge?: string
  children: ReactNode
  className?: string
  accent?: 'green' | 'blue' | 'amber' | 'red'
}

const accentBorder = {
  green: 'rgba(5,150,105,0.2)',
  blue:  'rgba(13,13,11,0.09)',
  amber: 'rgba(217,119,6,0.2)',
  red:   'rgba(220,38,38,0.2)',
}

const accentTop = {
  green: '#059669',
  blue:  undefined,
  amber: '#D97706',
  red:   '#DC2626',
}

export default function Card({ title, icon, badge, children, className = '', accent }: CardProps) {
  const border = accent ? accentBorder[accent] : 'rgba(13,13,11,0.09)'
  const top    = accent ? accentTop[accent] : undefined

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white ${className}`}
      style={{
        border: `1px solid ${border}`,
        boxShadow: '0 1px 4px rgba(13,13,11,0.04)',
      }}
    >
      {top && <div className="h-[2px]" style={{ background: top }} />}

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
      >
        <h2
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}
        >
          {icon && <span style={{ color: '#9A9A98' }}>{icon}</span>}
          {title}
        </h2>
        {badge && (
          <span
            className="tag"
            style={{ background: 'rgba(13,13,11,0.04)', color: '#6A6A68', border: '1px solid rgba(13,13,11,0.08)' }}
          >
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

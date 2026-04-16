'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function WatchlistButton({ symbol }: { symbol: string }) {
  const [saved, setSaved]     = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.watchlist.isSaved(symbol).then(r => setSaved(r.saved)).catch(() => setSaved(false))
  }, [symbol])

  async function toggle() {
    if (saved === null) return
    setLoading(true)
    try {
      if (saved) {
        await api.watchlist.remove(symbol)
        setSaved(false)
      } else {
        await api.watchlist.add(symbol)
        setSaved(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (saved === null) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      aria-pressed={saved}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
      style={saved ? {
        background:  '#FEF3C7',
        color:       '#92400E',
        border:      '1px solid rgba(146,64,14,0.25)',
        fontFamily:  'var(--font-sans), Inter, sans-serif',
        fontSize:    '12px',
        fontWeight:  500,
      } : {
        background:  '#FFFFFF',
        color:       '#6B7280',
        border:      '1px solid rgba(0,0,0,0.1)',
        fontFamily:  'var(--font-sans), Inter, sans-serif',
        fontSize:    '12px',
        fontWeight:  500,
      }}
      onMouseEnter={e => {
        if (!saved) {
          (e.currentTarget as HTMLElement).style.background = '#D1FAE5'
          ;(e.currentTarget as HTMLElement).style.color = '#047857'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,120,87,0.25)'
        }
      }}
      onMouseLeave={e => {
        if (!saved) {
          (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
          ;(e.currentTarget as HTMLElement).style.color = '#6B7280'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.1)'
        }
      }}
    >
      <svg
        width="12" height="12"
        viewBox="0 0 24 24"
        fill={saved ? '#D97706' : 'none'}
        stroke={saved ? '#D97706' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      {saved ? 'Saved' : 'Watchlist'}
    </button>
  )
}

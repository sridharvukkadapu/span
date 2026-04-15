'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function WatchlistButton({ symbol }: { symbol: string }) {
  const [saved, setSaved] = useState<boolean | null>(null)
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
      className="btn disabled:opacity-50 transition-all"
      style={saved ? {
        background:  'rgba(245,158,11,0.10)',
        color:       '#fbbf24',
        borderColor: 'rgba(245,158,11,0.22)',
      } : {
        background:  'rgba(255,255,255,0.05)',
        color:       '#94a3b8',
        borderColor: 'rgba(255,255,255,0.10)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? '#fbbf24' : 'none'} stroke={saved ? '#fbbf24' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      {saved ? 'Saved' : 'Watchlist'}
    </button>
  )
}

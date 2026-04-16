'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'span_recently_viewed'
const MAX = 5

export function trackView(symbol: string) {
  try {
    const existing: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    const updated = [symbol, ...existing.filter(s => s !== symbol)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}
}

export default function RecentlyViewed() {
  const [tickers, setTickers] = useState<string[]>([])

  useEffect(() => {
    try {
      setTickers(JSON.parse(localStorage.getItem(KEY) ?? '[]'))
    } catch {}
  }, [])

  if (tickers.length === 0) return null

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <p className="label-xs" style={{ color: '#B0B0AE' }}>Recently viewed</p>
      <div className="flex flex-wrap gap-1.5">
        {tickers.slice(0, 5).map(t => (
          <Link
            key={t}
            href={`/view/${t}`}
            className="num text-xs font-bold tracking-widest transition-all px-3 py-1 rounded"
            style={{
              background: 'rgba(13,13,11,0.05)',
              border: '1px solid rgba(13,13,11,0.1)',
              color: '#4A4A48',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.07)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(5,150,105,0.2)'
              ;(e.currentTarget as HTMLElement).style.color = '#047857'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,11,0.05)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(13,13,11,0.1)'
              ;(e.currentTarget as HTMLElement).style.color = '#4A4A48'
            }}
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  )
}

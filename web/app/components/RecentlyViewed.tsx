'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const KEY = 'span_recently_viewed'
const MAX = 8

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
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-[9px] text-smoke uppercase tracking-[0.12em] font-semibold">Recently viewed</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {tickers.map(t => (
          <Link
            key={t}
            href={`/view/${t}`}
            className="font-mono text-xs font-bold tracking-widest transition-all"
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background    = 'rgba(16,185,129,0.08)'
              el.style.borderColor   = 'rgba(16,185,129,0.2)'
              el.style.color         = '#34d399'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background    = 'rgba(255,255,255,0.04)'
              el.style.borderColor   = 'rgba(255,255,255,0.08)'
              el.style.color         = '#64748b'
            }}
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  )
}

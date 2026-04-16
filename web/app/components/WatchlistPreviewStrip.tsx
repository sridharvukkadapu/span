'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface WatchlistStock {
  symbol: string
  score: number
  signal: 'BUY' | 'HOLD' | 'SELL'
  price: string | null
  companyName: string | null
  greens: number
  reds: number
  totalChecks: number
}

const SIGNAL_COLOR: Record<string, string> = {
  BUY:  '#047857',
  HOLD: '#92400E',
  SELL: '#991B1B',
}
const SIGNAL_BG: Record<string, string> = {
  BUY:  '#D1FAE5',
  HOLD: '#FEF3C7',
  SELL: '#FEE2E2',
}
const SIGNAL_BORDER: Record<string, string> = {
  BUY:  'rgba(4,120,87,0.25)',
  HOLD: 'rgba(146,64,14,0.25)',
  SELL: 'rgba(153,27,27,0.2)',
}

export default function WatchlistPreviewStrip() {
  const [stocks, setStocks] = useState<WatchlistStock[]>([])

  useEffect(() => {
    async function load() {
      try {
        const tickers: string[] = await fetch('/api/v1/watchlist').then(r => r.json()).catch(() => [])
        if (!tickers.length) return

        const data = await fetch('/api/v1/dashboard?limit=100').then(r => r.json()).catch(() => null)
        if (!data?.stocks) return

        const watchlistSet = new Set(tickers.map(t => t.toUpperCase()))
        const matched: WatchlistStock[] = (data.stocks as WatchlistStock[])
          .filter(s => watchlistSet.has(s.symbol.toUpperCase()))
          .slice(0, 8)

        setStocks(matched)
      } catch {}
    }
    load()
  }, [])

  if (stocks.length === 0) return null

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontFamily:    'var(--font-sans), Inter, sans-serif',
            fontSize:      '10px',
            fontWeight:    600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color:         '#9CA3AF',
          }}
        >
          Watchlist
        </span>
        <Link
          href="/watchlist"
          style={{
            fontFamily:    'var(--font-sans), Inter, sans-serif',
            fontSize:      '10px',
            fontWeight:    500,
            color:         '#D1D5DB',
            transition:    'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#047857'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#D1D5DB'}
        >
          Manage →
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {stocks.map(s => {
          const color  = SIGNAL_COLOR[s.signal]
          const bg     = SIGNAL_BG[s.signal]
          const border = SIGNAL_BORDER[s.signal]
          return (
            <Link
              key={s.symbol}
              href={`/view/${s.symbol}`}
              className="shrink-0 rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 block"
              style={{
                background: '#FFFFFF',
                border:     '1px solid rgba(0,0,0,0.07)',
                boxShadow:  '0 1px 3px rgba(0,0,0,0.05)',
                minWidth:   '130px',
              }}
            >
              {/* Signal accent bar */}
              <div
                className="h-[2px] -mx-3.5 -mt-3.5 mb-3 rounded-t-xl"
                style={{ background: color }}
              />

              <div
                style={{
                  fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
                  fontSize:      '12px',
                  fontWeight:    600,
                  color:         '#111827',
                  letterSpacing: '0.04em',
                  marginBottom:  '2px',
                }}
              >
                {s.symbol}
              </div>
              {s.companyName && (
                <div
                  className="truncate mb-2.5"
                  style={{
                    fontFamily: 'var(--font-sans), Inter, sans-serif',
                    fontSize:   '10px',
                    color:      '#9CA3AF',
                    maxWidth:   '110px',
                  }}
                >
                  {s.companyName.replace(/ (Class [A-Z]|Common Stock|Inc\.|Corp\.).*$/, '')}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span
                  style={{
                    fontFamily:  'var(--font-mono), "JetBrains Mono", monospace',
                    fontSize:    '11px',
                    fontWeight:  500,
                    color:       '#374151',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.price ?? '—'}
                </span>
                <span
                  style={{
                    fontFamily:    'var(--font-sans), Inter, sans-serif',
                    fontSize:      '8px',
                    fontWeight:    700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background:    bg,
                    color,
                    border:        `1px solid ${border}`,
                    borderRadius:  '4px',
                    padding:       '1px 5px',
                  }}
                >
                  {s.signal}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

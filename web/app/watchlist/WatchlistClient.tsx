'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function WatchlistClient({ initialTickers }: { initialTickers: string[] }) {
  const [tickers, setTickers] = useState(initialTickers)
  const [removing, setRemoving] = useState<string | null>(null)

  async function remove(ticker: string) {
    setRemoving(ticker)
    await api.watchlist.remove(ticker)
    setTickers(prev => prev.filter(t => t !== ticker))
    setRemoving(null)
  }

  if (tickers.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-white mb-1">Your watchlist is empty</p>
        <p className="text-xs text-slate-600 mb-5">Add stocks from the screener or leaderboard</p>
        <Link
          href="/dashboard"
          className="btn btn-ghost text-[10px]"
        >
          Browse stocks →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {tickers.map((ticker, i) => (
        <div
          key={ticker}
          className="flex items-center justify-between px-5 py-4 group transition-colors"
          style={{
            borderBottom: i < tickers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="num text-[10px] font-bold text-slate-400">{i + 1}</span>
            </div>
            <div>
              <Link
                href={`/view/${ticker}`}
                className="num text-base font-bold text-white tracking-wider hover:text-emerald-400 transition-colors"
              >
                {ticker}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/view/${ticker}`}
              className="btn btn-ghost text-[9px] py-1 px-2.5"
            >
              Screener
            </Link>
            <Link
              href={`/basic-analyzer/${ticker}`}
              className="btn btn-ghost text-[9px] py-1 px-2.5"
            >
              Analyze
            </Link>
            <button
              onClick={() => remove(ticker)}
              disabled={removing === ticker}
              className="py-1 px-2.5 rounded-lg text-[9px] font-semibold uppercase tracking-wide transition-all"
              style={{
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: removing === ticker ? '#64748b' : '#f87171',
              }}
            >
              {removing === ticker ? '…' : 'Remove'}
            </button>
          </div>
        </div>
      ))}

      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="label-xs text-slate-600">{tickers.length} {tickers.length === 1 ? 'ticker' : 'tickers'}</span>
        <Link href="/dashboard" className="label-xs text-emerald-600 hover:text-emerald-400 transition-colors">
          Add more →
        </Link>
      </div>
    </div>
  )
}

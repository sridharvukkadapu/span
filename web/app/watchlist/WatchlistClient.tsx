'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function WatchlistClient({ initialTickers }: { initialTickers: string[] }) {
  const [tickers, setTickers] = useState(initialTickers)

  async function remove(ticker: string) {
    await api.watchlist.remove(ticker)
    setTickers(prev => prev.filter(t => t !== ticker))
  }

  if (tickers.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <div className="text-4xl mb-3">☆</div>
        <p className="text-sm text-slate-500">
          Your watchlist is empty.{' '}
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            Browse stocks →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      {tickers.map((ticker, i) => (
        <div
          key={ticker}
          className={`flex items-center justify-between px-6 py-4 ${i < tickers.length - 1 ? 'border-b border-white/[0.05]' : ''} hover:bg-white/[0.02] transition-colors`}
        >
          <Link href={`/view/${ticker}`} className="text-base font-black text-blue-400 hover:text-blue-300 tracking-wider transition-colors">
            {ticker}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/view/${ticker}`}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/15 transition-all"
            >
              Screener
            </Link>
            <Link
              href={`/basic-analyzer/${ticker}`}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/15 transition-all"
            >
              Analyze
            </Link>
            <button
              onClick={() => remove(ticker)}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/15 transition-all"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

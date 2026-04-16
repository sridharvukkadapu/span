'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface TopSuggestion {
  symbol: string
  companyName: string | null
  score: number
}

/* ── Alphabet colors for ticker avatars ── */
const AVATAR_COLORS = [
  { bg: 'rgba(5,150,105,0.10)',  border: 'rgba(5,150,105,0.22)',  text: '#047857' },
  { bg: 'rgba(217,119,6,0.10)', border: 'rgba(217,119,6,0.22)',  text: '#B45309' },
  { bg: 'rgba(13,13,11,0.07)',   border: 'rgba(13,13,11,0.15)',   text: '#4A4A48' },
  { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.18)',  text: '#B91C1C' },
]

function avatarColor(ticker: string) {
  const idx = ticker.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export default function WatchlistClient({
  initialTickers,
  topSuggestions = [],
}: {
  initialTickers: string[]
  topSuggestions?: TopSuggestion[]
}) {
  const [tickers,  setTickers]  = useState(initialTickers)
  const [removing, setRemoving] = useState<string | null>(null)
  const [adding,   setAdding]   = useState<string | null>(null)

  async function remove(ticker: string) {
    setRemoving(ticker)
    await api.watchlist.remove(ticker)
    setTickers(prev => prev.filter(t => t !== ticker))
    setRemoving(null)
  }

  async function addFromSuggestion(ticker: string) {
    if (tickers.includes(ticker)) return
    setAdding(ticker)
    await api.watchlist.add(ticker)
    setTickers(prev => [...prev, ticker])
    setAdding(null)
  }

  if (tickers.length === 0) {
    return (
      <div className="px-5 py-8">
        {/* Empty state header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.18)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p className="font-bold text-base mb-1.5" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
            Your watchlist is empty
          </p>
          <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#9A9A98' }}>
            Add stocks from the screener or pick from today&apos;s top buy signals below.
          </p>
        </div>

        {/* Top suggestions */}
        {topSuggestions.length > 0 && (
          <div>
            <div className="label-xs mb-3" style={{ color: '#9A9A98' }}>Top buy signals today</div>
            <div className="space-y-2">
              {topSuggestions.map(s => {
                const av = avatarColor(s.symbol)
                const isAdding = adding === s.symbol
                return (
                  <div
                    key={s.symbol}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                    style={{ background: 'rgba(13,13,11,0.03)', border: '1px solid rgba(13,13,11,0.07)' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: av.bg, border: `1px solid ${av.border}` }}
                    >
                      <span className="num text-[11px] font-bold" style={{ color: av.text }}>
                        {s.symbol.slice(0, 2)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="num font-bold text-sm" style={{ color: '#0D0D0B' }}>{s.symbol}</div>
                      {s.companyName && (
                        <div className="text-[10px] truncate" style={{ color: '#9A9A98' }}>{s.companyName}</div>
                      )}
                    </div>

                    {/* Score chip */}
                    <div
                      className="num text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{ background: 'rgba(5,150,105,0.08)', color: '#047857', border: '1px solid rgba(5,150,105,0.18)' }}
                    >
                      {s.score > 0 ? '+' : ''}{s.score}
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => addFromSuggestion(s.symbol)}
                      disabled={isAdding}
                      aria-label={`Add ${s.symbol} to watchlist`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                      style={{
                        background: 'rgba(5,150,105,0.09)',
                        border:     '1px solid rgba(5,150,105,0.22)',
                      }}
                    >
                      {isAdding ? (
                        <span className="num text-[9px]" style={{ color: '#9A9A98' }}>…</span>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 text-center">
              <Link href="/dashboard" className="label-xs transition-colors hover:text-[#047857]" style={{ color: '#9A9A98' }}>
                Browse all stocks →
              </Link>
            </div>
          </div>
        )}

        {topSuggestions.length === 0 && (
          <div className="text-center">
            <Link href="/dashboard" className="btn btn-primary text-[11px]">
              Browse Leaderboard →
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-5">
      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {tickers.map((ticker, i) => {
          const av = avatarColor(ticker)
          const isRemoving = removing === ticker
          return (
            <div
              key={ticker}
              className="relative rounded-xl overflow-hidden animate-fade-up"
              style={{
                background:   '#FFFFFF',
                border:       '1px solid rgba(13,13,11,0.09)',
                boxShadow:    '0 1px 4px rgba(13,13,11,0.04)',
                animationDelay: `${i * 0.04}s`,
                opacity:      isRemoving ? 0.5 : 1,
                transition:   'opacity 0.2s',
              }}
            >
              {/* Top stripe */}
              <div className="h-[2px]" style={{ background: av.text }} />

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: av.bg, border: `1px solid ${av.border}` }}
                    >
                      <span className="num text-sm font-bold" style={{ color: av.text }}>
                        {ticker.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="num font-bold text-base tracking-wide" style={{ color: '#0D0D0B' }}>
                        {ticker}
                      </div>
                      <div className="label-xs mt-0.5" style={{ color: '#C0C0BE' }}>
                        #{i + 1} watchlist
                      </div>
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => remove(ticker)}
                    disabled={isRemoving}
                    aria-label={`Remove ${ticker} from watchlist`}
                    className="w-7 h-7 rounded flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: 'rgba(220,38,38,0.07)',
                      border:     '1px solid rgba(220,38,38,0.16)',
                    }}
                  >
                    {isRemoving ? (
                      <span className="num text-[9px]" style={{ color: '#9A9A98' }}>…</span>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/view/${ticker}`}
                    className="flex-1 btn btn-primary text-[10px] justify-center"
                    style={{ minHeight: '36px', padding: '6px 10px' }}
                  >
                    Analysis
                  </Link>
                  <Link
                    href={`/basic-analyzer/${ticker}`}
                    className="btn btn-ghost text-[10px] justify-center"
                    style={{ minHeight: '36px', padding: '6px 12px' }}
                  >
                    Quick Val.
                  </Link>
                </div>

                {/* Quick links row */}
                <div className="flex items-center gap-2 mt-2.5">
                  {[
                    { label: 'Backtest', href: `/backtest/${ticker}` },
                    { label: 'DCF',      href: `/analyzer/${ticker}` },
                  ].map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="text-[10px] font-semibold transition-colors"
                      style={{
                        color:      '#9A9A98',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid rgba(13,13,11,0.07)' }}
      >
        <span className="label-xs" style={{ color: '#9A9A98' }}>
          {tickers.length} {tickers.length === 1 ? 'ticker' : 'tickers'} watched
        </span>
        <Link href="/dashboard" className="label-xs transition-colors hover:text-[#047857]" style={{ color: '#9A9A98' }}>
          Add more →
        </Link>
      </div>
    </div>
  )
}

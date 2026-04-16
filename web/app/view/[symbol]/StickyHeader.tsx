'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Signal } from '@/lib/types'
import SignalBadge from '@/app/components/SignalBadge'

interface Props {
  symbol:   string
  company:  string | null
  score:    number
  signal:   Signal
  price:    string | null
}

const SIGNAL_COLOR: Record<Signal, string> = {
  BUY:  '#047857',
  HOLD: '#92400E',
  SELL: '#991B1B',
}

export default function StickyHeader({ symbol, company, score, signal, price }: Props) {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const fillColor = SIGNAL_COLOR[signal]
  const scoreTextColor =
    signal === 'BUY'  ? '#047857' :
    signal === 'SELL' ? '#991B1B' : '#92400E'

  return (
    <>
      {/* Sentinel — placed at top of hero card */}
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-px pointer-events-none" aria-hidden="true" />

      {/* Sticky bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          transform:  visible ? 'translateY(0)' : 'translateY(-100%)',
          opacity:    visible ? 1 : 0,
          background: 'rgba(255,255,255,0.97)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        aria-hidden={!visible}
      >
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-4">
          {/* Mini score ring */}
          <div className="relative w-8 h-8 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle
                cx="16" cy="16" r="12"
                fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 12 * 0.75} ${2 * Math.PI * 12}`}
                strokeDashoffset={0} strokeLinecap="round"
                style={{ transform: 'rotate(-225deg)', transformOrigin: '50% 50%' }}
              />
              <circle
                cx="16" cy="16" r="12"
                fill="none" stroke={fillColor} strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 12 * 0.75} ${2 * Math.PI * 12}`}
                strokeDashoffset={2 * Math.PI * 12 * 0.75 * (1 - Math.max(0, Math.min(1, (score + 17) / 42)))}
                strokeLinecap="round"
                style={{ transform: 'rotate(-225deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center num text-[8px] font-bold"
              style={{ color: scoreTextColor }}
            >
              {score}
            </span>
          </div>

          {/* Ticker + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="num font-bold text-sm tracking-wide" style={{ color: '#111827' }}>{symbol}</span>
              {company && (
                <span className="text-xs truncate" style={{ color: '#9A9A98', fontFamily: 'var(--font-sans), Inter, sans-serif' }}>
                  {company}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          {price && (
            <span className="num text-sm font-bold" style={{ color: '#111827' }}>{price}</span>
          )}

          {/* Signal badge */}
          <SignalBadge signal={signal} size="sm" variant="filled" />

          {/* Back to leaderboard */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors"
            style={{ color: '#9A9A98', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#047857')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9A9A98')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Leaderboard
          </Link>
        </div>
      </div>
    </>
  )
}

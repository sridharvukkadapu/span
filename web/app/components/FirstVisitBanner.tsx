'use client'

import { useEffect, useState } from 'react'

const KEY = 'span_intro_dismissed'

export default function FirstVisitBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true)
    } catch {}
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(KEY, '1') } catch {}
  }

  if (!visible) return null

  return (
    <div
      className="animate-fade-in"
      style={{
        background:   'rgba(4,120,87,0.05)',
        borderBottom: '1px solid rgba(4,120,87,0.12)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full shrink-0"
            style={{ background: '#D1FAE5', border: '1px solid rgba(4,120,87,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#047857' }} />
            <span
              style={{
                fontFamily:    'var(--font-sans), Inter, sans-serif',
                fontSize:      '8px',
                fontWeight:    700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         '#047857',
              }}
            >
              Free
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize:   '11px',
              color:      '#374151',
              lineHeight: 1.5,
            }}
          >
            Algorithmic screening + DCF valuation + 5-year backtest — all in one score. Search any ticker to get started.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 flex items-center justify-center w-5 h-5 rounded transition-colors"
          style={{ color: '#D1D5DB' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
          onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

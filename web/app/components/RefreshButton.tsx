'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RefreshButton({ symbol }: { symbol: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleRefresh() {
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch(`/api/v1/cache/${symbol.toUpperCase()}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`${res.status}`)
      setState('done')
      // Re-fetch page data after short delay to let backend re-warm
      setTimeout(() => {
        router.refresh()
        setState('idle')
      }, 800)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const isLoading = state === 'loading'
  const isDone    = state === 'done'
  const isError   = state === 'error'

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      aria-label="Refresh stock data"
      title="Clear cache and reload latest data"
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '6px',
        padding:        '7px 14px',
        borderRadius:   '8px',
        border:         `1px solid ${isError ? 'rgba(220,38,38,0.3)' : isDone ? 'rgba(4,120,87,0.3)' : 'rgba(13,13,11,0.12)'}`,
        background:     isError ? 'rgba(220,38,38,0.05)' : isDone ? 'rgba(4,120,87,0.06)' : '#FFFFFF',
        cursor:         isLoading ? 'not-allowed' : 'pointer',
        transition:     'all 150ms ease',
        touchAction:    'manipulation',
        minHeight:      '36px',
        minWidth:       '36px',
        opacity:        isLoading ? 0.7 : 1,
        boxShadow:      '0 1px 3px rgba(13,13,11,0.06)',
      }}
      onMouseEnter={e => {
        if (!isLoading) (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,11,0.04)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background =
          isError ? 'rgba(220,38,38,0.05)' : isDone ? 'rgba(4,120,87,0.06)' : '#FFFFFF'
      }}
    >
      {/* Icon */}
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke={isError ? '#DC2626' : isDone ? '#047857' : '#6B7280'}
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true"
        style={{
          animation: isLoading ? 'spin 0.8s linear infinite' : undefined,
          flexShrink: 0,
        }}
      >
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>

      {/* Label */}
      <span
        style={{
          fontFamily:    'var(--font-sans), Inter, sans-serif',
          fontSize:      '11px',
          fontWeight:    600,
          letterSpacing: '0.04em',
          color:         isError ? '#DC2626' : isDone ? '#047857' : '#6B7280',
          whiteSpace:    'nowrap',
        }}
      >
        {isLoading ? 'Refreshing…' : isDone ? 'Updated' : isError ? 'Failed' : 'Refresh'}
      </span>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}

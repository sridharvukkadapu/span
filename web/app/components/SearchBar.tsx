'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Suggestion {
  symbol: string
  companyName: string | null
}

const suggestionCache = new Map<string, Suggestion[]>()

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(4,120,87,0.15)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchBar({ variant = 'nav' }: { variant?: 'nav' | 'hero' }) {
  const router = useRouter()
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activeIdx, setActiveIdx]     = useState(-1)
  const [open, setOpen]               = useState(false)
  const [loading, setLoading]         = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 1) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const cacheKey = q.toUpperCase()
    if (suggestionCache.has(cacheKey)) {
      const cached = suggestionCache.get(cacheKey)!
      setSuggestions(cached)
      setOpen(cached.length > 0)
      return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    try {
      const res = await fetch(`/api/v1/dashboard?limit=100`, { signal: abortRef.current.signal })
      if (!res.ok) return
      const data = await res.json()
      const stocks: Array<{ symbol: string; companyName: string | null }> = data.stocks ?? []

      const filtered = stocks
        .filter(s =>
          s.symbol.toUpperCase().includes(cacheKey) ||
          (s.companyName ?? '').toLowerCase().includes(q.toLowerCase())
        )
        .slice(0, 6)
        .map(s => ({ symbol: s.symbol, companyName: s.companyName }))

      suggestionCache.set(cacheKey, filtered)
      setSuggestions(filtered)
      setOpen(filtered.length > 0)
    } catch {
      // aborted or network error
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    setActiveIdx(-1)
    fetchSuggestions(val)
  }

  function navigate(symbol: string) {
    setOpen(false)
    setQuery('')
    setSuggestions([])
    router.push(`/view/${symbol.toUpperCase()}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = activeIdx >= 0 ? suggestions[activeIdx]?.symbol : query.trim()
    if (target) navigate(target)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  const isHero = variant === 'hero'

  return (
    <div className={`relative ${isHero ? 'w-full max-w-[480px]' : 'shrink-0'}`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex items-center flex-1">
          {/* Search icon */}
          <span className="absolute left-3 pointer-events-none" style={{ color: '#9CA3AF' }}>
            <svg width={isHero ? 14 : 12} height={isHero ? 14 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>

          <input
            ref={inputRef}
            name="q"
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(4,120,87,0.5)'
              e.currentTarget.style.background  = isHero ? 'rgba(4,120,87,0.03)' : 'rgba(4,120,87,0.04)'
              e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(4,120,87,0.08)'
              if (suggestions.length > 0) setOpen(true)
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = isHero ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.08)'
              e.currentTarget.style.background  = isHero ? '#FFFFFF' : 'rgba(0,0,0,0.04)'
              e.currentTarget.style.boxShadow   = isHero ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
            }}
            placeholder={isHero ? 'Search any ticker…  AAPL, TSLA, NVDA' : 'Search ticker…'}
            maxLength={10}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search by ticker symbol"
            aria-autocomplete="list"
            aria-expanded={open}
            className={`
              ${isHero
                ? 'w-full pl-9 pr-16 py-3 rounded-xl text-[13px] font-medium min-h-[48px]'
                : 'w-[150px] pl-8 pr-10 py-1.5 rounded-lg text-[11px] font-medium min-h-[34px]'
              }
              placeholder:font-normal placeholder:normal-case placeholder:tracking-normal
              focus:outline-none transition-all
            `}
            style={{
              background:  isHero ? '#FFFFFF' : 'rgba(0,0,0,0.04)',
              border:      isHero ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.08)',
              color:       '#111827',
              fontFamily:  'var(--font-sans), Inter, sans-serif',
              boxShadow:   isHero ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
            }}
          />

          {/* ⌘K hint */}
          <span className="absolute right-3 pointer-events-none flex items-center" style={{ color: '#D1D5DB' }}>
            {loading ? (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>…</span>
            ) : (
              <span
                style={{
                  fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
                  fontSize:      isHero ? '9px' : '8px',
                  background:    'rgba(0,0,0,0.05)',
                  border:        '1px solid rgba(0,0,0,0.08)',
                  borderRadius:  '3px',
                  padding:       '1px 4px',
                }}
              >
                ⌘K
              </span>
            )}
          </span>
        </div>

        {/* GO button — nav variant only */}
        {!isHero && (
          <button
            type="submit"
            aria-label="Search ticker"
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all min-h-[34px] active:scale-95"
            style={{
              background: '#111827',
              color:      '#FFFFFF',
              border:     '1px solid #111827',
              fontFamily: 'var(--font-sans), Inter, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#374151' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#111827' }}
          >
            Go
          </button>
        )}
      </form>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropRef}
          role="listbox"
          className="absolute top-full left-0 mt-1.5 z-[200] rounded-xl overflow-hidden animate-fade-in"
          style={{
            width:      '100%',
            minWidth:   '220px',
            background: '#FFFFFF',
            border:     '1px solid rgba(0,0,0,0.09)',
            boxShadow:  '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.symbol}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={e => { e.preventDefault(); navigate(s.symbol) }}
              onMouseEnter={() => setActiveIdx(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{
                background:   i === activeIdx ? '#D1FAE5' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                    fontSize:   '9px',
                    fontWeight: 600,
                    color:      '#6B7280',
                  }}
                >
                  {s.symbol.slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
                    fontSize:      '11px',
                    fontWeight:    600,
                    color:         '#111827',
                    letterSpacing: '0.04em',
                  }}
                >
                  {highlight(s.symbol, query.toUpperCase())}
                </div>
                {s.companyName && (
                  <div
                    className="truncate mt-0.5"
                    style={{
                      fontFamily: 'var(--font-sans), Inter, sans-serif',
                      fontSize:   '10px',
                      color:      '#9CA3AF',
                    }}
                  >
                    {highlight(s.companyName, query)}
                  </div>
                )}
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

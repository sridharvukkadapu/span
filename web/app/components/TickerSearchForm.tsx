'use client'

export default function TickerSearchForm() {
  return (
    <form
      className="flex items-center gap-2.5"
      onSubmit={e => {
        e.preventDefault()
        const v = (e.currentTarget.elements.namedItem('ticker') as HTMLInputElement).value
          .trim()
          .toUpperCase()
        if (v) window.location.href = `/view/${v}`
      }}
    >
      <input
        name="ticker"
        type="text"
        placeholder="AAPL, NVDA, MSFT…"
        maxLength={6}
        autoFocus
        aria-label="Enter ticker symbol to analyze"
        className="w-52 pl-4 pr-4 py-3 rounded-lg text-[#0D0D0B] num font-bold text-sm tracking-widest uppercase placeholder:text-[#9A9A98] placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus:outline-none transition-all min-h-[48px]"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(13,13,11,0.14)',
          boxShadow: 'inset 0 1px 3px rgba(13,13,11,0.04)',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(5,150,105,0.5)'
          e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(5,150,105,0.08), inset 0 1px 3px rgba(13,13,11,0.04)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(13,13,11,0.14)'
          e.currentTarget.style.boxShadow   = 'inset 0 1px 3px rgba(13,13,11,0.04)'
        }}
      />
      <button
        type="submit"
        aria-label="Analyze ticker"
        className="px-7 py-3 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-95 min-h-[48px] uppercase tracking-wider"
        style={{
          background:  '#0D0D0B',
          color:       '#F5F4F0',
          boxShadow:   '0 2px 8px rgba(13,13,11,0.2)',
          fontFamily:  'var(--font-body)',
          letterSpacing: '0.06em',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background  = '#2A2A28'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(13,13,11,0.3)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background  = '#0D0D0B'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(13,13,11,0.2)'
        }}
      >
        Screen →
      </button>
    </form>
  )
}

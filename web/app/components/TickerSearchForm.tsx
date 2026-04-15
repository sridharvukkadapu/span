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
      <div className="relative group">
        <input
          name="ticker"
          type="text"
          placeholder="AAPL, NVDA, MSFT…"
          maxLength={6}
          autoFocus
          className="w-52 pl-4 pr-4 py-3 rounded-xl text-white font-mono font-bold text-sm tracking-widest uppercase placeholder:text-smoke placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)'
            e.currentTarget.style.background   = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.boxShadow    = '0 0 0 3px rgba(16,185,129,0.08)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
            e.currentTarget.style.background  = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-95"
        style={{
          background:  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color:       '#fff',
          boxShadow:   '0 4px 16px rgba(16,185,129,0.25)',
          fontFamily:  'var(--font-body)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(16,185,129,0.35)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(16,185,129,0.25)'
        }}
      >
        Analyze →
      </button>
    </form>
  )
}

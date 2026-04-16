export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2' }}>
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8">

        {/* Search + signal bar skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <div
            className="animate-shimmer rounded-xl"
            style={{ height: 40, flex: 1, maxWidth: 448 }}
          />
          <div
            className="animate-shimmer rounded-xl shrink-0"
            style={{ height: 40, width: 200 }}
          />
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="animate-shimmer rounded" style={{ height: 12, width: 80 }} />
          <div className="animate-shimmer rounded" style={{ height: 12, width: 60 }} />
        </div>

        {/* Filter card skeleton */}
        <div
          className="rounded-xl mb-3"
          style={{
            background:  '#FFFFFF',
            border:      '1px solid rgba(0,0,0,0.07)',
            boxShadow:   '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="animate-shimmer rounded-lg" style={{ height: 34 }} />
          </div>
          <div className="px-4 py-3 flex items-center gap-2">
            {[48, 52, 52, 40, 52, 52, 52, 52, 40].map((w, i) => (
              <div
                key={i}
                className="animate-shimmer rounded-full"
                style={{ height: 28, width: w }}
              />
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: '#FFFFFF',
            border:     '1px solid rgba(0,0,0,0.07)',
            boxShadow:  '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.015)' }}
          >
            {[32, 100, 64, 48, 72, 80, 56, 64, 40].map((w, i) => (
              <div key={i} className="animate-shimmer rounded" style={{ height: 10, width: w }} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-4 py-3"
              style={{
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                background:   i % 2 === 1 ? '#F9F8F4' : '#FFFFFF',
              }}
            >
              <div className="animate-shimmer rounded" style={{ height: 12, width: 20 }} />
              <div style={{ flex: 1, maxWidth: 140 }}>
                <div className="animate-shimmer rounded" style={{ height: 12, width: 48, marginBottom: 4 }} />
                <div className="animate-shimmer rounded" style={{ height: 9, width: 100 }} />
              </div>
              <div className="animate-shimmer rounded-full" style={{ height: 18, width: 48 }} />
              <div className="animate-shimmer rounded" style={{ height: 20, width: 36 }} />
              <div className="flex gap-[2px]">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="animate-shimmer" style={{ width: 6, height: 6, borderRadius: 1 }} />
                ))}
              </div>
              <div className="animate-shimmer rounded" style={{ height: 18, width: 52 }} />
              <div className="ml-auto animate-shimmer rounded" style={{ height: 12, width: 52 }} />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

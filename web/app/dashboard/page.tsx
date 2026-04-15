import { api } from '@/lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DashboardFilters from './DashboardFilters'

export const revalidate = 60

export default async function DashboardPage() {
  const data  = await api.dashboard(100).catch(() => null)
  const stocks = data?.stocks ?? []
  const status = data?.status

  const buys  = stocks.filter(s => s.signal === 'BUY').length
  const holds = stocks.filter(s => s.signal === 'HOLD').length
  const sells = stocks.filter(s => s.signal === 'SELL').length
  const pct   = status ? Math.round((status.scannedCount / status.universeSize) * 100) : 0

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-5 py-8">

        {/* ── Page header ── */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="tag font-mono" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.18)' }}>
              LIVE
            </span>
            <span className="text-[10px] text-smoke font-mono">Updated every 60s</span>
          </div>
          <h1 className="text-3xl font-display text-white">Stock Discovery</h1>
          <p className="text-sm text-fog mt-1">
            {stocks.length} stocks ranked by composite fundamental score
          </p>
        </div>

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.06s' }}>
          {[
            { label: 'BUY',    value: buys,  color: '#34d399', border: 'rgba(16,185,129,0.2)',  bg: 'rgba(16,185,129,0.06)' },
            { label: 'HOLD',   value: holds, color: '#fbbf24', border: 'rgba(245,158,11,0.2)',  bg: 'rgba(245,158,11,0.05)' },
            { label: 'SELL',   value: sells, color: '#f87171', border: 'rgba(239,68,68,0.18)',  bg: 'rgba(239,68,68,0.05)' },
            { label: 'TOTAL',  value: stocks.length, color: '#94a3b8', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.03)' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3.5"
              style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
            >
              <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Scan progress ── */}
        {status && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-up"
            style={{ animationDelay: '0.10s', background: '#0a1221', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {status.scannedCount < status.universeSize ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
                      <span className="text-xs text-fog font-mono">
                        Scanning: <span className="text-white font-bold">{status.nextTicker ?? '…'}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-emerald-400 font-mono font-semibold">Full cycle complete</span>
                    </>
                  )}
                </div>
                <span className="text-xs font-mono text-fog">
                  {status.scannedCount}/{status.universeSize} · {pct}%
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  }}
                />
              </div>
            </div>
            <div
              className="shrink-0 text-center px-4 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="font-mono text-base font-bold text-white">{status.scansCompleted}</div>
              <div className="text-[9px] text-smoke uppercase tracking-wider">Scans</div>
            </div>
          </div>
        )}

        {/* ── Filters + Table ── */}
        <div className="animate-fade-up" style={{ animationDelay: '0.14s' }}>
          <DashboardFilters stocks={stocks} />
        </div>

        <div className="mt-6">
          <Footer />
        </div>
      </div>
    </div>
  )
}

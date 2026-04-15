import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import MetricCard from '../../components/MetricCard'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import AnalyzerClient from './AnalyzerClient'

export const revalidate = 60

interface Props { params: { symbol: string } }

const IconBarChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
)
const IconDollar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

export default async function AnalyzerPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  const data = await api.analyzer(symbol).catch(() => null)
  if (!data) notFound()

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-4">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-2xl text-center px-6 py-12 animate-fade-up"
          style={{
            background: 'linear-gradient(180deg, #0d1628 0%, #0a1221 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.3) 0%, transparent 65%)' }}
          />
          <div className="relative z-10">
            <div
              className="inline-block font-mono text-[10px] font-bold tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {symbol} · Advanced Analyzer
            </div>
            <h1 className="text-2xl font-display text-white mt-1">{data.companyName ?? symbol}</h1>
            <div className="font-mono text-4xl font-bold text-white mt-4 tabular-nums">{data.currentPriceFormatted ?? '—'}</div>
            <div className="flex justify-center gap-6 mt-3 text-sm text-fog">
              <span>Mkt Cap: <span className="font-mono font-semibold text-mist">{data.marketCapFormatted ?? '—'}</span></span>
              <span>Shares: <span className="font-mono font-semibold text-mist">{data.sharesFormatted ?? '—'}</span></span>
            </div>
          </div>
        </div>

        {/* ── Historical Metrics ── */}
        <Card title="Historical Metrics (TTM)" icon={<IconBarChart />} accent="blue">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricCard label="Revenue Growth" value={data.revenueGrowthFormatted} />
            <MetricCard label="Profit Margin"  value={data.profitMarginFormatted} />
            <MetricCard label="FCF Margin"     value={data.fcfMarginFormatted} />
            <MetricCard label="ROIC"           value={data.roicFormatted} />
            <MetricCard label="P/E Ratio"      value={data.currentPEFormatted} />
            <MetricCard label="P/FCF"          value={data.currentPFCFFormatted} />
          </div>
        </Card>

        {/* ── TTM Financials ── */}
        <Card title="TTM Financials" icon={<IconDollar />}>
          <div className="grid grid-cols-3 gap-2.5">
            <MetricCard label="Revenue"         value={data.ttmRevenueFormatted} />
            <MetricCard label="Net Income"      value={data.ttmNetIncomeFormatted} />
            <MetricCard label="Free Cash Flow"  value={data.ttmFcfFormatted} />
          </div>
        </Card>

        {/* ── Turnaround alert ── */}
        {data.turnaroundMode && (
          <div
            className="flex items-start gap-3 rounded-xl px-5 py-4 animate-fade-up"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div className="text-sm font-semibold text-amber-400 mb-1">Turnaround Mode</div>
              <div className="text-xs text-fog leading-relaxed">
                This company is currently unprofitable (profit margin {data.profitMarginFormatted ?? '—'}, FCF margin {data.fcfMarginFormatted ?? '—'}).
                Scenarios model a path to profitability with target margins. A 7-year horizon is used to allow time for the turnaround.
              </div>
            </div>
          </div>
        )}

        <AnalyzerClient data={data} />

        {/* ── Disclaimer ── */}
        <div
          className="rounded-xl px-5 py-4 text-xs text-fog leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <span className="font-semibold text-amber-500">Disclaimer: </span>
          Educational purposes only. DCF projections are based on user-provided assumptions and simplified models. Not financial advice.
        </div>

        <Footer />
      </div>
    </div>
  )
}

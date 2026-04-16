import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import MetricCard from '../../components/MetricCard'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import AnalyzerClient from './AnalyzerClient'

export const revalidate = 60

interface Props { params: { symbol: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase()
  const data = await api.analyzer(symbol).catch(() => null)
  const name = data?.companyName ?? symbol
  return {
    title: `${symbol} DCF Valuation`,
    description: `${name} discounted cash flow model. Bear, base, and bull scenario fair value with adjustable assumptions.`,
  }
}

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
          className="relative overflow-hidden rounded-xl animate-fade-up"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(13,13,11,0.09)',
            boxShadow: '0 1px 4px rgba(13,13,11,0.04)',
          }}
        >
          <div className="h-[3px]" style={{ background: '#0D0D0B' }} />
          <div className="px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="label-xs mb-1.5" style={{ color: '#9A9A98' }}>{symbol} · DCF Analyzer</div>
              <h1
                className="font-display font-bold text-2xl leading-tight"
                style={{ color: '#0D0D0B', letterSpacing: '-0.02em' }}
              >
                {data.companyName ?? symbol}
              </h1>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="label-xs mb-1" style={{ color: '#9A9A98' }}>Current Price</div>
                <div className="num text-3xl font-bold" style={{ color: '#0D0D0B' }}>{data.currentPriceFormatted ?? '—'}</div>
              </div>
              <div className="text-sm" style={{ color: '#6A6A68' }}>
                <div>Mkt Cap: <span className="num font-semibold" style={{ color: '#0D0D0B' }}>{data.marketCapFormatted ?? '—'}</span></div>
                <div>Shares: <span className="num font-semibold" style={{ color: '#0D0D0B' }}>{data.sharesFormatted ?? '—'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Historical Metrics ── */}
        <Card title="Historical Metrics (TTM)" accent="blue">
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
        <Card title="TTM Financials">
          <div className="grid grid-cols-3 gap-2.5">
            <MetricCard label="Revenue"        value={data.ttmRevenueFormatted} highlight />
            <MetricCard label="Net Income"     value={data.ttmNetIncomeFormatted} />
            <MetricCard label="Free Cash Flow" value={data.ttmFcfFormatted} />
          </div>
        </Card>

        {/* ── Turnaround alert ── */}
        {data.turnaroundMode && (
          <div
            className="flex items-start gap-3 rounded-lg px-5 py-4 animate-fade-up"
            style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.18)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#B45309' }}>Turnaround Mode</div>
              <div className="text-xs leading-relaxed" style={{ color: '#6A6A68' }}>
                This company is currently unprofitable (profit margin {data.profitMarginFormatted ?? '—'}, FCF margin {data.fcfMarginFormatted ?? '—'}).
                Scenarios model a path to profitability. A 7-year horizon is used.
              </div>
            </div>
          </div>
        )}

        <AnalyzerClient data={data} />

        {/* ── Disclaimer ── */}
        <div
          className="rounded-lg px-5 py-4 text-xs leading-relaxed"
          style={{ background: 'rgba(13,13,11,0.03)', border: '1px solid rgba(13,13,11,0.08)' }}
        >
          <span className="font-bold" style={{ color: '#6A6A68' }}>Disclaimer: </span>
          <span style={{ color: '#9A9A98' }}>Educational purposes only. DCF projections are based on user-provided assumptions and simplified models. Not financial advice.</span>
        </div>

        <Footer />
      </div>
    </div>
  )
}

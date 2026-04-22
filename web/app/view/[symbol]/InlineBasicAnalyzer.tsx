'use client'

import { useState } from 'react'
import type { BasicAnalyzerData } from '@/lib/types'
import BasicAnalyzerClient from '@/app/basic-analyzer/[symbol]/BasicAnalyzerClient'

export default function InlineBasicAnalyzer({ data }: { data: BasicAnalyzerData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-up"
      style={{
        background: '#FFFFFF',
        border:     '1px solid rgba(13,13,11,0.09)',
        boxShadow:  '0 1px 4px rgba(13,13,11,0.04)',
      }}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: expanded ? '1px solid rgba(13,13,11,0.07)' : 'none' }}
      >
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}
        >
          Basic Valuation
        </span>
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded transition-all"
          style={{
            background: expanded ? 'rgba(5,150,105,0.08)' : 'rgba(13,13,11,0.05)',
            border:     expanded ? '1px solid rgba(5,150,105,0.2)' : '1px solid rgba(13,13,11,0.1)',
            color:      expanded ? '#047857' : '#6A6A68',
            fontFamily: 'var(--font-body)',
          }}
          aria-expanded={expanded}
          aria-controls="basic-analyzer-content"
        >
          {expanded ? (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Reasonable &amp; Great Execution →
            </>
          )}
        </button>
      </div>

      {/* Summary row */}
      {!expanded && (
        <div className="px-5 py-4">
          <p className="text-[11px] leading-relaxed" style={{ color: '#9A9A98' }}>
            Reasonable and Great Execution scenarios using revenue growth, margins, and P/E multiple.
            {data.currentPrice != null && (
              <> Current price: <span className="num font-semibold" style={{ color: '#0D0D0B' }}>${data.currentPrice.toFixed(2)}</span>.</>
            )}
            {' '}Click <span className="font-semibold" style={{ color: '#047857' }}>Reasonable &amp; Great Execution</span> to edit scenario sliders.
          </p>
        </div>
      )}

      {/* Full basic analyzer */}
      {expanded && (
        <div id="basic-analyzer-content" className="p-5 space-y-4">
          <BasicAnalyzerClient data={data} />
        </div>
      )}
    </div>
  )
}

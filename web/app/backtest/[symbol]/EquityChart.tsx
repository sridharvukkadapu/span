'use client'

import { useEffect, useRef } from 'react'
import type { EquityPoint } from '@/lib/types'

export default function EquityChart({ data }: { data: EquityPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    let chart: import('chart.js').Chart | undefined

    async function init() {
      const { Chart, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } =
        await import('chart.js')
      Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

      const ctx = canvasRef.current!.getContext('2d')!
      const grad = ctx.createLinearGradient(0, 0, 0, 360)
      grad.addColorStop(0, 'rgba(59,130,246,0.2)')
      grad.addColorStop(1, 'rgba(59,130,246,0)')

      const gradBH = ctx.createLinearGradient(0, 0, 0, 360)
      gradBH.addColorStop(0, 'rgba(100,116,139,0.08)')
      gradBH.addColorStop(1, 'rgba(100,116,139,0)')

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.date),
          datasets: [
            {
              label: 'Span Strategy',
              data: data.map(d => d.strategyValue),
              borderColor: '#60a5fa',
              backgroundColor: grad,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2.5,
            },
            {
              label: 'Buy & Hold',
              data: data.map(d => d.buyAndHoldValue),
              borderColor: '#475569',
              backgroundColor: gradBH,
              fill: true,
              borderDash: [4, 4],
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 4,
              borderWidth: 1.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12, boxHeight: 2, padding: 20 },
            },
            tooltip: {
              backgroundColor: '#0d1425',
              titleColor: '#e2e8f0',
              bodyColor: '#94a3b8',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              cornerRadius: 10,
              padding: 12,
              callbacks: {
                label: c => `${c.dataset.label}: $${(c.parsed.y as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { maxTicksLimit: 8, color: '#334155', font: { family: 'Inter', size: 10 } } },
            y: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { callback: v => `$${(v as number).toLocaleString()}`, color: '#334155', font: { family: 'Inter', size: 10 } },
            },
          },
        },
      })
    }

    init()
    return () => { chart?.destroy() }
  }, [data])

  return (
    <div className="relative h-80">
      <canvas ref={canvasRef} />
    </div>
  )
}

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

      // Strategy: dark ink line
      const grad = ctx.createLinearGradient(0, 0, 0, 360)
      grad.addColorStop(0, 'rgba(5,150,105,0.15)')
      grad.addColorStop(1, 'rgba(5,150,105,0)')

      // Buy & Hold: muted gray
      const gradBH = ctx.createLinearGradient(0, 0, 0, 360)
      gradBH.addColorStop(0, 'rgba(13,13,11,0.06)')
      gradBH.addColorStop(1, 'rgba(13,13,11,0)')

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.date),
          datasets: [
            {
              label: 'Span Strategy',
              data: data.map(d => d.strategyValue),
              borderColor: '#059669',
              backgroundColor: grad,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
            {
              label: 'Buy & Hold',
              data: data.map(d => d.buyAndHoldValue),
              borderColor: '#9A9A98',
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
              labels: {
                color: '#6A6A68',
                font: { family: 'IBM Plex Mono, monospace', size: 11 },
                boxWidth: 12,
                boxHeight: 2,
                padding: 20,
              },
            },
            tooltip: {
              backgroundColor: '#FFFFFF',
              titleColor: '#0D0D0B',
              bodyColor: '#6A6A68',
              borderColor: 'rgba(13,13,11,0.12)',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                label: c => `${c.dataset.label}: $${(c.parsed.y as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(13,13,11,0.05)' },
              ticks: { maxTicksLimit: 8, color: '#9A9A98', font: { family: 'IBM Plex Mono, monospace', size: 10 } },
              border: { color: 'rgba(13,13,11,0.1)' },
            },
            y: {
              grid: { color: 'rgba(13,13,11,0.05)' },
              ticks: {
                callback: v => `$${(v as number).toLocaleString()}`,
                color: '#9A9A98',
                font: { family: 'IBM Plex Mono, monospace', size: 10 },
              },
              border: { color: 'rgba(13,13,11,0.1)' },
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

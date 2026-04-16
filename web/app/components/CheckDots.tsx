/**
 * CheckDots — Compact segment bar strip showing pass/warn/fail checks.
 * Used in dashboard table rows and watchlist cards.
 */

import type { CheckLight } from '@/lib/types'

interface Props {
  greens:      number
  yellows?:    number
  reds:        number
  totalChecks: number
  size?:       'sm' | 'md'
}

export default function CheckDots({ greens, yellows = 0, reds, totalChecks, size = 'sm' }: Props) {
  const segs: CheckLight[] = []
  for (let i = 0; i < totalChecks; i++) {
    if (i < greens)                      segs.push('GREEN')
    else if (i < greens + yellows)       segs.push('YELLOW')
    else if (i >= totalChecks - reds)    segs.push('RED')
    else                                 segs.push('YELLOW')
  }

  const segW = size === 'md' ? 7 : 5
  const segH = size === 'md' ? 7 : 5

  const colorMap: Record<CheckLight, string> = {
    GREEN:  '#059669',
    YELLOW: '#D97706',
    RED:    '#DC2626',
  }

  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label={`${greens} pass, ${yellows} warn, ${reds} fail`}
      title={`${greens} pass · ${yellows} warn · ${reds} fail`}
    >
      {segs.map((light, i) => (
        <span
          key={i}
          style={{
            display:     'block',
            width:       segW,
            height:      segH,
            borderRadius: 1,
            background:  colorMap[light],
            flexShrink:  0,
          }}
        />
      ))}
    </div>
  )
}

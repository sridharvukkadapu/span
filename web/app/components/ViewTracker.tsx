'use client'

import { useEffect } from 'react'
import { trackView } from './RecentlyViewed'

export default function ViewTracker({ symbol }: { symbol: string }) {
  useEffect(() => { trackView(symbol) }, [symbol])
  return null
}

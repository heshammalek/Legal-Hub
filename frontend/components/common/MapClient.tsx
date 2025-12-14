//frontend/components/common/MapClient.tsx
'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// حمّل InteractiveMap بدون SSR
const InteractiveMap = dynamic(
  () => import('@/components/map/InteractiveMap'),
  { ssr: false }
)

export interface MapPoint {
  lat: number
  lng: number
  name?: string
}

interface Props {
  points: MapPoint[]
  /** يمكنك تمرير مركز افتراضي أو مستوى تكبير هنا */
  center?: [number, number]
  zoom?: number
}

export default function MapClient({
  points,
  center,
  zoom
}: Props) {
  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <InteractiveMap
        points={points}
        center={center}
        zoom={zoom}
      />
    </div>
  )
}

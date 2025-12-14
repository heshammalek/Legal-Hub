'use client'

import React from 'react'
import MapClient, { MapPoint } from 'components/common/MapClient'
import Section from 'components/dashboard/Section'

interface Props {
  points: MapPoint[]
  title?: string
}

export default function MapSection({
  points,
  title = 'خريطتنا'
}: Props) {
  return (
    <Section title={title}>
      {points.length > 0 ? (
        <MapClient points={points} />
      ) : (
        <p className="text-center text-gray-500 py-12">
          لا توجد نقاط للعرض على الخريطة
        </p>
      )}
    </Section>
  )
}

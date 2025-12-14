//frontend/components/map/InteractiveMap.tsx
'use client'

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// إصلاح مسارات أيقونات Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:        require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:      require('leaflet/dist/images/marker-shadow.png')
})

// أيقونة حمراء للمستخدم
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#DC2626" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

// أيقونة زرقاء للمحامين (بدون رمز الميزان)
const lawyerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#2563EB" stroke="white" stroke-width="2"/>
      <path d="M8 9h8M8 13h8M8 17h5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

export interface MapPoint {
  lat: number
  lng: number
  name?: string
}

interface Props {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
}

export default function InteractiveMap({
  points,
  center = [30.0444, 31.2357], // القاهرة افتراضيًا
  zoom = 6
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((pt, idx) => (
        <Marker 
          key={idx} 
          position={[pt.lat, pt.lng]}
          icon={pt.name?.includes('موقعك') ? userIcon : lawyerIcon}
        >
          <Popup>{pt.name ?? `Location #${idx + 1}`}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
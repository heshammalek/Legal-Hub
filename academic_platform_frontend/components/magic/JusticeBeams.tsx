'use client'

import { motion } from 'framer-motion'

interface JusticeBeamsProps {
  intensity: number
}

export default function JusticeBeams({ intensity }: JusticeBeamsProps) {
  const beams = Array.from({ length: 8 }, (_, i) => i)

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {beams.map((beam) => (
        <motion.div
          key={beam}
          className="absolute top-0 w-1 bg-linear-to-b from-yellow-400/80 to-transparent"
          initial={{ 
            height: '0%',
            left: `${(beam / beams.length) * 100}%`,
            opacity: 0 
          }}
          animate={{ 
            height: `${30 + intensity * 70}%`,
            opacity: 0.3 + intensity * 0.4
          }}
          transition={{
            duration: 2,
            delay: beam * 0.2,
            ease: "easeOut"
          }}
          style={{
            transform: `rotate(${beam * 45}deg) translateX(-50%)`,
            transformOrigin: 'bottom center',
            filter: 'blur(8px)'
          }}
        />
      ))}
      
      {/* تأثير الإضاءة المركزي */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(30, 58, 138, 0.1) 70%, transparent 100%)',
          filter: 'blur(20px)'
        }}
      />
    </div>
  )
}
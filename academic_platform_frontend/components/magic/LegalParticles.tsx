'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  type: 'document' | 'gavel' | 'scale'
}

interface LegalParticlesProps {
  active: boolean
}

export default function LegalParticles({ active }: LegalParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 20,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 1,
        type: ['document', 'gavel', 'scale'][Math.floor(Math.random() * 3)] as 'document' | 'gavel' | 'scale'
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => setParticles([]), 5000)
      return () => clearTimeout(timer)
    }
  }, [active])

  const getParticleEmoji = (type: string) => {
    switch (type) {
      case 'document': return '📜'
      case 'gavel': return '⚖️'
      case 'scale': return '⚖️'
      default: return '✨'
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute text-2xl pointer-events-none"
          initial={{
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
            scale: 0,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          animate={{
            y: [`${particle.y}vh`, `${particle.y - 50}vh`],
            x: [`${particle.x}vw`, `${particle.x + (Math.random() * 20 - 10)}vw`],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "easeOut"
          }}
          style={{
            fontSize: `${particle.size}px`,
            filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.7))'
          }}
        >
          {getParticleEmoji(particle.type)}
        </motion.div>
      ))}
    </div>
  )
}
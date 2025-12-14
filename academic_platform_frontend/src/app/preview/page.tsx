// src/app/preview/page.tsx - نسخة مصححة
'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function PreviewPage() {
  const [stage, setStage] = useState('entrance')

  if (stage === 'entrance') {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <motion.h1 
            className="text-6xl font-bold mb-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            ⚖️
          </motion.h1>
          <motion.h2 
            className="text-4xl font-bold mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            محكمة المستقبل
          </motion.h2>
          <motion.button
            onClick={() => setStage('portal')}
            className="px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-xl hover:scale-105 transition-transform"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            ابدأ الرحلة
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 to-blue-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-center text-white"
      >
        <h2 className="text-3xl font-bold mb-8">🚪 بوابة المؤسسات</h2>
        <button
          onClick={() => setStage('entrance')}
          className="px-8 py-4 bg-white text-purple-900 rounded-xl font-bold text-xl"
        >
          العودة
        </button>
      </motion.div>
    </div>
  )
}
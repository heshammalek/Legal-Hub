'use client'

export const useSound = () => {
  const playSound = (soundType: string, volume: number = 1) => {
    if (typeof window === 'undefined') return
    
    try {
      // محاكاة الأصوات باستخدام Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      switch(soundType) {
        case 'portal':
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
          break
        case 'gavel':
          oscillator.type = 'square'
          oscillator.frequency.setValueAtTime(196.00, audioContext.currentTime)
          break
        case 'scroll':
          oscillator.type = 'triangle'
          oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime)
          break
        case 'success':
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)
          break
      }
      
      gainNode.gain.setValueAtTime(volume * 0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1)
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
      
    } catch (error) {
      console.log('Web Audio API not supported')
    }
  }

  const playPortalSound = () => playSound('portal', 0.6)
  const playGavelSound = () => playSound('gavel', 0.8)
  const playScrollSound = () => playSound('scroll', 0.4)
  const playSuccessSound = () => playSound('success', 0.7)

  return { 
    playPortalSound, 
    playGavelSound, 
    playScrollSound,
    playSuccessSound
  }
}

export default useSound
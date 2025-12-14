// src/lib/animations.ts
export const legalAnimations = {
  gavelStrike: {
    keyframes: `
      @keyframes gavelStrike {
        0% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(-15deg) scale(1.1); }
        50% { transform: rotate(0deg) scale(1.2); }
        75% { transform: rotate(-5deg) scale(1.1); }
        100% { transform: rotate(0deg) scale(1); }
      }
    `,
    duration: 0.8,
    timing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  documentReveal: {
    keyframes: `
      @keyframes documentReveal {
        0% { 
          transform: translateY(100px) rotateX(90deg) scale(0.8);
          opacity: 0;
        }
        70% { 
          transform: translateY(-10px) rotateX(0deg) scale(1.05);
          opacity: 1;
        }
        100% { 
          transform: translateY(0) rotateX(0deg) scale(1);
          opacity: 1;
        }
      }
    `,
    duration: 1.2,
    timing: 'ease-out'
  },

  scaleBalance: {
    keyframes: `
      @keyframes scaleBalance {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
        75% { transform: rotate(-3deg); }
        100% { transform: rotate(0deg); }
      }
    `,
    duration: 2,
    timing: 'ease-in-out'
  }
}

export const useAnimation = () => {
  const legalEntrance = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -50, scale: 1.2 },
    transition: { duration: 0.8, type: "spring" }
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return {
    legalEntrance,
    fadeInUp,
    staggerChildren
  }
}

export default useAnimation
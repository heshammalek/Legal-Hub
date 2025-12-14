// types/three.d.ts
declare module '@react-three/fiber' {
  import { ThreeElements } from '@react-three/fiber';
  export * from '@react-three/fiber';
}

declare module '@react-three/drei' {
  export * from '@react-three/drei';
}

// أنواع Three.js المحددة
declare module 'three' {
  export * from 'three';
}

// تعريفات JSX لـ React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Lights
      ambientLight: any;
      spotLight: any;
      pointLight: any;
      directionalLight: any;
      
      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      planeGeometry: any;
      
      // Materials
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhongMaterial: any;
      meshPhysicalMaterial: any;
      
      // Primitives
      mesh: any;
      group: any;
      primitive: any;
      
      // Controls
      orbitControls: any;
      
      // Environment
      environment: any;
    }
  }
}
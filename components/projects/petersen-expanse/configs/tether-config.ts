import * as THREE from 'three'

export interface TetherConfig {
  // Visual parameters
  particlesPerTether: number
  particleSize: number
  archHeight: number
  baseOpacity: number
  glowIntensity: number
  
  // Animation parameters
  flowSpeed: number
  pulseFrequency: number
  
  // Colors
  colors: {
    forward: THREE.Color
    reverse: THREE.Color
  }
  
  // Rendering
  renderOrder: number
  blendMode: THREE.Blending
  
  // Performance
  maxTethers: number
  lodDistances: number[]
}

export const tetherConfig: TetherConfig = {
  // Visual parameters
  particlesPerTether: 32,
  particleSize: 8.0,
  archHeight: 150.0, // Height of arch above/below XZ plane
  baseOpacity: 0.7,
  glowIntensity: 1.2,
  
  // Animation parameters  
  flowSpeed: 0.5, // Speed of flowing particles along arch
  pulseFrequency: 1.0, // Frequency of pulsing effect
  
  // Colors
  colors: {
    forward: new THREE.Color(0x00ccff), // Cyan for upward arches
    reverse: new THREE.Color(0xff6600)  // Orange for downward arches
  },
  
  // Rendering
  renderOrder: 100,
  blendMode: THREE.AdditiveBlending,
  
  // Performance
  maxTethers: 60,
  lodDistances: [1000, 2000, 5000] // Distance-based level of detail
}

// Tether connection patterns based on Petersen Graph
export const tetherConnections = {
  // 30 forward connections (arching upward)
  forward: [
    // Outer ring to inner ring connections (10)
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    [5, 0], [6, 1], [7, 2], [8, 3], [9, 4],
    
    // Outer to inner spoke connections (10)  
    [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
    [5, 15], [6, 16], [7, 17], [8, 18], [9, 19],
    
    // Inner ring connections (10)
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]
  ],
  
  // 30 reverse connections (arching downward)
  reverse: [
    // Mirror of forward connections
    [5, 0], [6, 1], [7, 2], [8, 3], [9, 4],
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    
    [10, 0], [11, 1], [12, 2], [13, 3], [14, 4],
    [15, 5], [16, 6], [17, 7], [18, 8], [19, 9],
    
    [11, 10], [12, 11], [13, 12], [14, 13], [15, 14],
    [16, 15], [17, 16], [18, 17], [19, 18], [10, 19]
  ]
}

// LOD configuration for performance optimization
export const tetherLOD = {
  high: {
    particlesPerTether: 32,
    particleSize: 8.0,
    maxDistance: 1000
  },
  medium: {
    particlesPerTether: 16,
    particleSize: 6.0,
    maxDistance: 2000
  },
  low: {
    particlesPerTether: 8,
    particleSize: 4.0,
    maxDistance: 5000
  },
  minimal: {
    particlesPerTether: 4,
    particleSize: 2.0,
    maxDistance: Infinity
  }
}
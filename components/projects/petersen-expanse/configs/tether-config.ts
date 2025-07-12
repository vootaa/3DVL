import { Color, AdditiveBlending } from 'three'
import type { Blending } from 'three'

export interface TetherConfig {
  // Visual parameters
  particlesPerTether: number
  particleSize: number
  archHeight: number
  archSegments: number
  baseOpacity: number
  glowIntensity: number

  // Animation parameters
  flowSpeed: number
  pulseFrequency: number

  // Colors
  colors: {
    forward: Color
    reverse: Color
  }

  // Rendering
  renderOrder: number
  blendMode: Blending

  // Performance
  maxTethers: number
}

export const tetherConfig: TetherConfig = {
  // Visual parameters
  particlesPerTether: 32, // Reduced for better performance
  particleSize: 20, // Reduced size
  archHeight: 1.2, // Increased arch height for better visibility
  archSegments: 16,
  baseOpacity: 0.8, // Increased opacity
  glowIntensity: 1.5, // Increased glow

  // Animation parameters  
  flowSpeed: 1.2, // Increased flow speed
  pulseFrequency: 0.8, // Reduced pulse frequency

  // Colors - more distinct colors
  colors: {
    forward: new Color(0x00aaff), // Brighter blue
    reverse: new Color(0xffaa00)  // Brighter orange
  },

  // Rendering
  renderOrder: 100,
  blendMode: AdditiveBlending,

  // Performance
  maxTethers: 60,
}

// Tether connection patterns based on Petersen Graph
export const tetherConnections = {
  // 30 forward connections (arching upward)
  forward: [
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
    [0, 15], [1, 16], [2, 17], [3, 18], [4, 19],
    [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]
  ],

  // 30 reverse connections (arching downward)
  reverse: [
    [5, 0], [6, 1], [7, 2], [8, 3], [9, 4],
    [10, 0], [11, 1], [12, 2], [13, 3], [14, 4],
    [15, 0], [16, 1], [17, 2], [18, 3], [19, 4],
    [7, 5], [8, 6], [9, 7], [5, 8], [6, 9],
    [11, 10], [12, 11], [13, 12], [14, 13], [15, 14],
    [16, 15], [17, 16], [18, 17], [19, 18], [10, 19]
  ]
}
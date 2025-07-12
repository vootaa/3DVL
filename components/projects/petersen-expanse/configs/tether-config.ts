import { AdditiveBlending } from 'three'
import type { Blending } from 'three'

export interface TetherConfig {
  // Visual parameters
  particlesPerTether: number
  particleSize: number
  archHeight: number
  baseOpacity: number

  // Animation parameters
  flowSpeed: number
  particleSpacing: number
  trailLength: number

  // Trail colors
  trailColors: {
    head: number // Brightness multiplier for head
    tail: number // Brightness multiplier for tail
  }

  // Rendering
  renderOrder: number
  blendMode: Blending

  // Performance
  maxTethers: number
}

export const tetherConfig: TetherConfig = {
  // Visual parameters
  particlesPerTether: 32, // particle count per tether
  particleSize: 1.0, // Slightly larger particles
  archHeight: 0.5, // Arch height
  baseOpacity: 0.8, // Base opacity

  // Animation parameters  
  flowSpeed: 0.25, // Flow speed for particle movement
  particleSpacing: 0.05, // Space between particles (0-1)
  trailLength: 0.35, // Length of particle trail effect

  // Trail colors - brightness multipliers
  trailColors: {
    head: 1.2, // Head particles are brighter (source node color)
    tail: 0.8  // Tail particles are slightly dimmer but still bright
  },

  // Rendering
  renderOrder: 100,
  blendMode: AdditiveBlending,

  // Performance
  maxTethers: 60,
}

// Tether connection patterns based on Petersen Graph
export const tetherConnections = {
  // Forward connections (flow from first to second)
  forward: [
    // Inner to Middle orbit connections
    [5, 0], [6, 1], [7, 2], [8, 3], [9, 4],
    // Middle to Outer orbit connections  
    [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
    [0, 15], [1, 16], [2, 17], [3, 18], [4, 19],
    // Inner orbit internal connections
    [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],
    // Outer orbit ring connections
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]
  ],

  // Reverse connections (flow from first to second, opposite direction)
  reverse: [
    // Middle to Inner orbit connections
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    // Outer to Middle orbit connections
    [10, 0], [11, 1], [12, 2], [13, 3], [14, 4],
    [15, 0], [16, 1], [17, 2], [18, 3], [19, 4],
    // Inner orbit reverse internal connections
    [7, 5], [8, 6], [9, 7], [5, 8], [6, 9],
    // Outer orbit reverse ring connections
    [11, 10], [12, 11], [13, 12], [14, 13], [15, 14],
    [16, 15], [17, 16], [18, 17], [19, 18], [10, 19]
  ]
}
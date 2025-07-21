import { Vector3 } from 'three'

import type { ValidShaderName } from '../shaders/shader-registry'

export interface PetersenNode {
  id: number
  r: number
  theta: number
  orbit: 'inner' | 'middle' | 'outer'
}
export interface TerrainConfig {
  // Terrain zone radii
  plainRadius: number      // Inner plain area radius
  transitionRadius: number // Transition area outer boundary radius  
  mountainRadius: number   // Mountain area outer boundary radius
  domeRadius: number       // Radius connecting to the dome

  // Height parameters
  maxHeight: number        // Maximum mountain height
  transitionHeight: number // Maximum transition area height

  // Grid parameters
  size: number            // Total terrain grid size
  segments: number        // Grid subdivisions

  // Noise parameters
  noiseScale: number      // Noise scale
  noiseIntensity: number  // Noise intensity
  ridgeNoiseScale: number // Ridge noise scale

  // Smoothing parameter
  transitionSmoothness: number // Transition smoothness

  enableEnergyEffects: boolean  // Control energy field visibility in plain area
}

export interface ShaderTVItem {
  shaderSource: ValidShaderName  // Shader source name
  angle: number         // Angle (degrees)
  radius: number        // Radius
  screenSize?: number   // Optional: screen size, uses default if not provided
  baseWidth?: number    // Optional: base width
  baseHeight?: number   // Optional: base height
}

export interface ShaderTVConfig {
  // Default configuration
  defaultScreenSize: number
  defaultBaseWidth: number
  defaultBaseHeight: number
  // TV list
  tvs: ShaderTVItem[]
}

export interface SceneConfig {
  shaderTV: ShaderTVConfig
  terrain: TerrainConfig
  dome: {
    radius: number
    segments: number
    energyShield: {
      intensity: number                         // Overall intensity
      edgeGlow: number                          // Edge glow intensity
      pulseSpeed: number                        // Pulse speed
      noiseScale: number                        // Energy noise detail
    }
  }
  rings: {
    thickness: number
    height: number
    inner: {
      radius: number
      width: number
    }
    middle: {
      radius: number
      width: number
    }
    outer: {
      radius: number
      width: number
    }
  }
  temples: {
    height: number
    baseSize: number
  }
  bridges: {
    width: number
    thickness: number
    height: number
    archHeight: number
  }
  movement: {
    boundaryRadius: number
  }
}
export const defaultConfig: SceneConfig = {
  shaderTV: {
    defaultScreenSize: 5.0,
    defaultBaseWidth: 0.2,
    defaultBaseHeight: 0.6,
    tvs: [
      { shaderSource: 'default-shader', angle: 252, radius: 22.5 },
      { shaderSource: 'petersen-graph', angle: 120, radius: 20.0 }
    ]
  },
  terrain: {
    plainRadius: 55,        // Plain area - player activity area
    transitionRadius: 70,   // Transition area - gradual hills
    mountainRadius: 85,     // Mountain area - diverse peaks
    domeRadius: 95,         // High mountain barrier - dramatic skyline

    // Enhanced height design
    maxHeight: 8,           // Maximum mountain base height
    transitionHeight: 3,    // Maximum transition area height

    // High-precision grid
    size: 200,
    segments: 64,          // Higher subdivisions for smoother terrain and shader effects

    // Optimized noise parameters
    noiseScale: 0.02,
    noiseIntensity: 1.2,
    ridgeNoiseScale: 0.008,

    transitionSmoothness: 0.8,

    enableEnergyEffects: false
  },
  dome: {
    radius: 100,
    segments: 32,
    energyShield: {
      intensity: 0.18,                 // Overall intensity
      edgeGlow: 1.0,                   // Edge glow intensity
      pulseSpeed: 0.5,                 // Pulse speed
      noiseScale: 0.8                  // Energy noise detail
    }
  },
  rings: {
    thickness: 0.4,
    height: 5.5,
    inner: {
      radius: 15,
      width: 5,
    },
    middle: {
      radius: 30,
      width: 5,
    },
    outer: {
      radius: 48,
      width: 5,
    }
  },
  temples: {
    height: 15.8,  // Height of the temple structure
    baseSize: 1.5  // Base size of the temple structure
  },
  bridges: {
    width: 1.2,        // Bridge width
    thickness: 0.4,    // Bridge thickness
    height: 6.5,       // Bridge height
    archHeight: 2.5,   // Maximum bridge arch height
  },
  movement: {
    boundaryRadius: 55  // Radius for movement boundary
  }
}

export const petersenNodes: PetersenNode[] = [
  // Middle (r=30)
  { id: 0, r: 30, theta: 288.0, orbit: 'middle' },
  { id: 1, r: 30, theta: 0.0, orbit: 'middle' },
  { id: 2, r: 30, theta: 72.0, orbit: 'middle' },
  { id: 3, r: 30, theta: 144.0, orbit: 'middle' },
  { id: 4, r: 30, theta: 216.0, orbit: 'middle' },

  // Inner (r=15)
  { id: 5, r: 15, theta: 288.0, orbit: 'inner' },
  { id: 6, r: 15, theta: 0.0, orbit: 'inner' },
  { id: 7, r: 15, theta: 72.0, orbit: 'inner' },
  { id: 8, r: 15, theta: 144.0, orbit: 'inner' },
  { id: 9, r: 15, theta: 216.0, orbit: 'inner' },

  // Outer (r=48)
  { id: 10, r: 48, theta: 278.0, orbit: 'outer' },
  { id: 11, r: 48, theta: 10.0, orbit: 'outer' },
  { id: 12, r: 48, theta: 62.0, orbit: 'outer' },
  { id: 13, r: 48, theta: 154.0, orbit: 'outer' },
  { id: 14, r: 48, theta: 206.0, orbit: 'outer' },
  { id: 15, r: 48, theta: 298.0, orbit: 'outer' },
  { id: 16, r: 48, theta: 350.0, orbit: 'outer' },
  { id: 17, r: 48, theta: 82.0, orbit: 'outer' },
  { id: 18, r: 48, theta: 134.0, orbit: 'outer' },
  { id: 19, r: 48, theta: 226.0, orbit: 'outer' }
]

export const petersenConnections = {
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
  ]
}

export const degToRad = (degrees: number): number => degrees * Math.PI / 180

export const polarToCartesian = (r: number, theta: number, height: number = 0): Vector3 => {
  const rad = degToRad(theta)
  return new Vector3(r * Math.cos(rad), height, r * Math.sin(rad))
}
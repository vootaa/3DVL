import { Vector3 } from 'three'

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
}

export interface SceneConfig {
  terrain: TerrainConfig
  dome: {
    radius: number
    segments: number
  }
  rings: {
    inner: {
      radius: number
      width: number
      thickness: number
      height: number
    }
    middle: {
      radius: number
      width: number
      thickness: number
      height: number
    }
    outer: {
      radius: number
      width: number
      thickness: number
      height: number
    }
  }
  temples: {
    outer: {
      radius: number
      height: number
      count: number
    }
    middle: {
      size: number
      height: number
      count: number
    }
    inner: {
      size: number
      height: number
      count: number
    }
  }
  bridges: {
    width: number
    thickness: number
    height: number
  }
  stairs: {
    count: number
    width: number
    height: number
    steps: number
  }
  movement: {
    boundaryRadius: number
  }
}

export const defaultConfig: SceneConfig = {
  terrain: {
    // Terrain zones (based on dome radius=100)
    plainRadius: 55,        // Plain area - includes all Petersen graph nodes
    transitionRadius: 70,   // Transition area - gentle slope from plain to mountain
    mountainRadius: 85,     // Mountain area - forms a natural boundary
    domeRadius: 95,         // Area connecting to the dome

    // Height design
    maxHeight: 12,          // Maximum mountain height
    transitionHeight: 4,    // Maximum transition area height

    // Grid parameters
    size: 200,              // Terrain grid size (covers dome area)
    segments: 256,          // High subdivision for smooth terrain

    // Noise parameters
    noiseScale: 0.015,      // Base noise scale
    noiseIntensity: 1.0,    // Noise intensity
    ridgeNoiseScale: 0.008, // Ridge noise (larger features)

    // Smoothing parameter
    transitionSmoothness: 0.7
  },
  dome: {
    radius: 100,
    segments: 32
  },
  rings: {
    inner: {
      radius: 15,
      width: 5,
      thickness: 0.1,
      height: 2
    },
    middle: {
      radius: 30,
      width: 6,
      thickness: 0.1,
      height: 2
    },
    outer: {
      radius: 48,
      width: 10,
      thickness: 0.1,
      height: 2
    }
  },
  temples: {
    outer: {
      radius: 1.25,
      height: 1.5,
      count: 10
    },
    middle: {
      size: 1.2,
      height: 1.5,
      count: 5
    },
    inner: {
      size: 1.0,
      height: 1.5,
      count: 5
    }
  },
  bridges: {
    width: 0.5,
    thickness: 0.05,
    height: 2
  },
  stairs: {
    count: 5,
    width: 0.4,
    height: 2,
    steps: 10
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
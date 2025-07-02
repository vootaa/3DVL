import { Color } from 'three'

// Star cluster data configuration
export const starClusterConfig = {
  // Star data
  stars: [
    // Middle orbit (r=0.300)
    { id: 0, r: 3.0, theta: 288.0, orbit: 'middle', type: 'golden-star' },
    { id: 1, r: 3.0, theta: 0.0, orbit: 'middle', type: 'golden-star' },
    { id: 2, r: 3.0, theta: 72.0, orbit: 'middle', type: 'golden-star' },
    { id: 3, r: 3.0, theta: 144.0, orbit: 'middle', type: 'golden-star' },
    { id: 4, r: 3.0, theta: 216.0, orbit: 'middle', type: 'golden-star' },
    
    // Inner orbit (r=0.150)
    { id: 5, r: 1.5, theta: 288.0, orbit: 'inner', type: 'green-star' },
    { id: 6, r: 1.5, theta: 0.0, orbit: 'inner', type: 'green-star' },
    { id: 7, r: 1.5, theta: 72.0, orbit: 'inner', type: 'green-star' },
    { id: 8, r: 1.5, theta: 144.0, orbit: 'inner', type: 'green-star' },
    { id: 9, r: 1.5, theta: 216.0, orbit: 'inner', type: 'green-star' },
    
    // Outer orbit (r=0.480)
    { id: 10, r: 4.8, theta: 278.0, orbit: 'outer', type: 'blue-star' },
    { id: 11, r: 4.8, theta: 10.0, orbit: 'outer', type: 'blue-star' },
    { id: 12, r: 4.8, theta: 62.0, orbit: 'outer', type: 'blue-star' },
    { id: 13, r: 4.8, theta: 154.0, orbit: 'outer', type: 'blue-star' },
    { id: 14, r: 4.8, theta: 206.0, orbit: 'outer', type: 'blue-star' },
    { id: 15, r: 4.8, theta: 298.0, orbit: 'outer', type: 'blue-star' },
    { id: 16, r: 4.8, theta: 350.0, orbit: 'outer', type: 'blue-star' },
    { id: 17, r: 4.8, theta: 82.0, orbit: 'outer', type: 'blue-star' },
    { id: 18, r: 4.8, theta: 134.0, orbit: 'outer', type: 'blue-star' },
    { id: 19, r: 4.8, theta: 226.0, orbit: 'outer', type: 'blue-star' }
  ],
  
  // Star visual properties
  visual: {
    // Star colors (arranged by actual visual appearance)
    colors: {
      'green-star': new Color('#00FF7F'),  // Inner orbit - bright green (spring green)
      'golden-star': new Color('#FFD700'), // Middle orbit - golden yellow
      'blue-star': new Color('#00BFFF')    // Outer orbit - bright blue (deep sky blue)
    },
    
    // Star size ranges
    sizes: {
      'green-star': { min: 18, max: 28 },  // 18-28 pixels
      'golden-star': { min: 25, max: 40 }, // 25-40 pixels
      'blue-star': { min: 35, max: 55 }    // 35-55 pixels
    },
    
    // Brightness settings
    brightness: {
      'green-star': { min: 0.8, max: 1.0 },
      'golden-star': { min: 0.85, max: 1.0 },
      'blue-star': { min: 0.85, max: 1.0 }   // Increased brightness range
    },
    
    // Twinkling frequency
    twinkleFrequency: {
      'green-star': { base: 2.0, variation: 1.0 },
      'golden-star': { base: 3.0, variation: 1.5 },
      'blue-star': { base: 1.5, variation: 0.8 }
    }
  },
  
  // Animation configuration
  animation: {
    // Global time speed
    timeSpeed: 1.0,
    
    // Pulse effect configuration
    pulse: {
      enabled: true,
      frequency: 4.0,
      amplitude: 0.15
    },
    
    // Color shift configuration
    colorShift: {
      enabled: true,
      redFreq: 2.0,
      greenFreq: 2.5,
      blueFreq: 1.8,
      amplitude: 0.1
    }
  }
}

// Utility functions
export const starClusterUtils = {
  // Convert polar coordinates to cartesian coordinates
  polarToCartesian(r: number, theta: number, heightVariation = 0.1) {
    const radians = (theta * Math.PI) / 180
    const x = r * Math.cos(radians)
    const z = r * Math.sin(radians)
    const y = (Math.random() - 0.5) * heightVariation
    return { x, y, z }
  },
  
  // Get star visual properties
  getStarVisuals(starType: string) {
    const config = starClusterConfig.visual
    return {
      color: config.colors[starType as keyof typeof config.colors],
      size: config.sizes[starType as keyof typeof config.sizes],
      brightness: config.brightness[starType as keyof typeof config.brightness],
      twinkle: config.twinkleFrequency[starType as keyof typeof config.twinkleFrequency]
    }
  }
}

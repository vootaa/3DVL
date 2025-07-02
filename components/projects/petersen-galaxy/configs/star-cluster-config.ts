import { Color } from 'three'

// Star cluster data configuration
export const starClusterConfig = {
  // Star data
  stars: [
    // Middle orbit (r=0.300)
    { id: 0, r: 3.0, theta: 288.0, orbit: 'middle', type: 'blue-giant' },
    { id: 1, r: 3.0, theta: 0.0, orbit: 'middle', type: 'blue-giant' },
    { id: 2, r: 3.0, theta: 72.0, orbit: 'middle', type: 'blue-giant' },
    { id: 3, r: 3.0, theta: 144.0, orbit: 'middle', type: 'blue-giant' },
    { id: 4, r: 3.0, theta: 216.0, orbit: 'middle', type: 'blue-giant' },
    
    // Inner orbit (r=0.150)
    { id: 5, r: 1.5, theta: 288.0, orbit: 'inner', type: 'main-sequence' },
    { id: 6, r: 1.5, theta: 0.0, orbit: 'inner', type: 'main-sequence' },
    { id: 7, r: 1.5, theta: 72.0, orbit: 'inner', type: 'main-sequence' },
    { id: 8, r: 1.5, theta: 144.0, orbit: 'inner', type: 'main-sequence' },
    { id: 9, r: 1.5, theta: 216.0, orbit: 'inner', type: 'main-sequence' },
    
    // Outer orbit (r=0.480)
    { id: 10, r: 4.8, theta: 278.0, orbit: 'outer', type: 'red-giant' },
    { id: 11, r: 4.8, theta: 10.0, orbit: 'outer', type: 'red-giant' },
    { id: 12, r: 4.8, theta: 62.0, orbit: 'outer', type: 'red-giant' },
    { id: 13, r: 4.8, theta: 154.0, orbit: 'outer', type: 'red-giant' },
    { id: 14, r: 4.8, theta: 206.0, orbit: 'outer', type: 'red-giant' },
    { id: 15, r: 4.8, theta: 298.0, orbit: 'outer', type: 'red-giant' },
    { id: 16, r: 4.8, theta: 350.0, orbit: 'outer', type: 'red-giant' },
    { id: 17, r: 4.8, theta: 82.0, orbit: 'outer', type: 'red-giant' },
    { id: 18, r: 4.8, theta: 134.0, orbit: 'outer', type: 'red-giant' },
    { id: 19, r: 4.8, theta: 226.0, orbit: 'outer', type: 'red-giant' }
  ],
  
  // Star visual properties
  visual: {
    // Star colors (based on real stellar spectral types)
    colors: {
      'main-sequence': new Color('#FFD700'), // G-type main sequence - golden (sun-like)
      'blue-giant': new Color('#87CEEB'),    // B-type blue giant - blue-white
      'red-giant': new Color('#FF4500')      // M-type red giant - orange-red
    },
    
    // Star size ranges
    sizes: {
      'main-sequence': { min: 18, max: 28 }, // 18-28 pixels
      'blue-giant': { min: 25, max: 40 },    // 25-40 pixels
      'red-giant': { min: 35, max: 55 }      // 35-55 pixels
    },
    
    // Brightness settings
    brightness: {
      'main-sequence': { min: 0.8, max: 1.0 },
      'blue-giant': { min: 0.85, max: 1.0 },
      'red-giant': { min: 0.75, max: 0.95 }
    },
    
    // Twinkling frequency
    twinkleFrequency: {
      'main-sequence': { base: 2.0, variation: 1.0 },
      'blue-giant': { base: 3.0, variation: 1.5 },
      'red-giant': { base: 1.5, variation: 0.8 }
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

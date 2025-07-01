import { Color } from 'three'

// Orbital parameters
export const orbitalConfig = {
  // Particle counts
  totalCount: 3500, // Balanced for clear rings and performance
  orbitParticleRatio: 0.7, // 70% orbital, 30% scattered
  
  // Orbital radii
  innerRadius: 1.5,   // 0.15 ratio
  middleRadius: 3.0,  // 0.3 ratio  
  outerRadius: 4.8,   // 0.48 ratio
  
  // Space boundaries
  maxSpaceRadius: 6.24, // outerRadius * 1.3
  
  // Particle properties
  particleSize: 8, // Smaller for thinner ring lines
  
  // Rotation speeds (inner faster, outer slower)
  rotationSpeeds: {
    inner: 0.8,
    middle: 0.5,
    outer: 0.3
  }
}

// Color scheme - same color family (cyan/blue tones)
export const colorConfig = {
  // Orbital ring colors (same color family, different intensities)
  innerRing: new Color('#00ffff'),    // Bright cyan
  middleRing: new Color('#00ccff'),   // Bright blue-cyan
  outerRing: new Color('#0099ff'),    // Bright blue
  
  // Scattered particles (contrasting warm colors for visibility)
  scattered: new Color('#ff6b35'),    // Orange-red for contrast
  scatteredSecondary: new Color('#ffa500'), // Orange variation
  
  // Brightness multipliers - increased for better visibility
  brightness: {
    inner: 2.0,   // Very bright
    middle: 1.8,  // Bright
    outer: 1.5,   // Moderately bright
    scattered: 1.0 // Brighter scattered particles
  }
}

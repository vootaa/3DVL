import { Color } from 'three'

// Orbital parameters
export const orbitalConfig = {
  // Particle counts
  totalCount: 3000,
  orbitParticleRatio: 0.7, // 70% orbital, 30% scattered
  
  // Orbital radii
  innerRadius: 1.5,   // 0.15 ratio
  middleRadius: 3.0,  // 0.3 ratio  
  outerRadius: 4.8,   // 0.48 ratio
  
  // Space boundaries
  maxSpaceRadius: 6.24, // outerRadius * 1.3
  
  // Particle properties
  particleSize: 12, // Increased for better visibility
  
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
  
  // Scattered particles (dimmer version of the same color family)
  scattered: new Color('#004488'),    // Dark blue
  
  // Brightness multipliers - increased for better visibility
  brightness: {
    inner: 2.0,   // Very bright
    middle: 1.8,  // Bright
    outer: 1.5,   // Moderately bright
    scattered: 0.6
  }
}

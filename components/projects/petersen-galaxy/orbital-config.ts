import { Color } from 'three'

// Orbital parameters
export const orbitalConfig = {
  // Particle counts
  totalCount: 6000, // Balanced for clear rings and performance
  orbitParticleRatio: 0.7, // 70% orbital, 30% scattered
  
  // Orbital distribution ratios (optimized: middle +50%, outer +100%)
  orbitDistribution: {
    inner: 0.25, 
    middle: 0.35,
    outer: 0.4
  },
  
  // Orbital radii
  innerRadius: 1.5,   // 0.15 ratio
  middleRadius: 3.0,  // 0.3 ratio  
  outerRadius: 4.8,   // 0.48 ratio
  
  // Space boundaries
  maxSpaceRadius: 6.24, // outerRadius * 1.3
  
  // Particle properties
  particleSize: 8, // Smaller for thinner ring lines
  
  // Rotation speeds (inner faster, outer slower) - reduced for better observation
  rotationSpeeds: {
    inner: 0.4,   // Reduced from 0.8
    middle: 0.25, // Reduced from 0.5
    outer: 0.15   // Reduced from 0.3
  }
}

// Orbital color scheme - consistent blue/cyan tones
export const orbitalColorConfig = {
  // Orbital ring colors (same color family, different intensities)
  innerRing: new Color('#00ffff'),    // Bright cyan
  middleRing: new Color('#00ccff'),   // Bright blue-cyan
  outerRing: new Color('#0099ff'),    // Bright blue
  
  // Scattered particles (same color family but dimmer)
  scatteredInner: new Color('#0099cc'), // Dimmer cyan for inner area
  scatteredMiddle: new Color('#0088bb'), // Dimmer blue-cyan for middle area
  scatteredOuter: new Color('#0077aa'),  // Dimmer blue for outer area
  
  // Brightness multipliers
  brightness: {
    inner: 2.0,     // Very bright
    middle: 1.8,    // Bright
    outer: 1.5,     // Moderately bright
    scattered: 0.8  // Increased from 0.6 for better visibility
  }
}

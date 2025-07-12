import { Color } from 'three'

// Orbital parameters
export const orbitalConfig = {
  // Particle counts
  totalCount: 8000,
  orbitParticleRatio: 0.8,
  
  // Orbital distribution ratios
  orbitDistribution: {
    inner: 0.2, 
    middle: 0.35,
    outer: 0.45
  },
  
  // Orbital radii
  innerRadius: 1.5,
  middleRadius: 3.0,
  outerRadius: 4.8,
  
  // Space boundaries
  maxSpaceRadius: 6.24,
  
  // Particle properties
  particleSize: 15,
}

// Orbital color scheme
export const orbitalColorConfig = {
  innerRing: new Color('#00ffff'),
  middleRing: new Color('#00ccff'),
  outerRing: new Color('#0099ff'),
  scatteredInner: new Color('#0099cc'),
  scatteredMiddle: new Color('#0088bb'),
  scatteredOuter: new Color('#0077aa'),
  
  brightness: {
    inner: 2.0,
    middle: 1.8,
    outer: 1.5,
    scattered: 0.8
  }
}
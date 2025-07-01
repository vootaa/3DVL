import { Vector3 } from 'three'

// Galaxy center drift configuration
export const galaxyDriftConfig = {
  // Enable/disable drift system
  enabled: true,
  
  // Drift motion parameters
  motionPattern: {
    // Primary drift velocity (very slow galaxy-scale movement)
    primaryVelocity: new Vector3(0.02, 0.01, 0.015), // units per second
    
    // Oscillation parameters for natural variation
    oscillation: {
      amplitude: new Vector3(0.5, 0.3, 0.4), // Maximum drift radius
      frequency: new Vector3(0.1, 0.15, 0.08), // Oscillation frequency (Hz)
      phase: new Vector3(0, Math.PI/3, Math.PI/2) // Phase offset for each axis
    },
    
    // Random perturbations for realistic motion
    perturbation: {
      strength: 0.05, // Strength of random noise
      frequency: 0.3   // How often perturbations change
    }
  },
  
  // Drift boundaries (prevent galaxy from drifting too far)
  boundaries: {
    maxDistance: 2.0, // Maximum distance from origin
    returnForce: 0.02  // Force pulling back to origin when near boundary
  },
  
  // Visual feedback
  showTrail: false, // Show drift trail (for debugging)
  trailLength: 100   // Number of trail points
}

// Galaxy drift state
export interface GalaxyDriftState {
  currentPosition: Vector3
  velocity: Vector3
  trailPoints: Vector3[]
  totalDistance: number
  driftTime: number
}

// Initialize drift state
export const createInitialDriftState = (): GalaxyDriftState => ({
  currentPosition: new Vector3(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  trailPoints: [],
  totalDistance: 0,
  driftTime: 0
})

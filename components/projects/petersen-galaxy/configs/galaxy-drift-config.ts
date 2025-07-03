import { Vector3 } from 'three'

// Galaxy center drift configuration
export const galaxyDriftConfig = {
  // Enable/disable drift system
  enabled: true,
  
  // Drift motion parameters
  motionPattern: {
    // Primary drift velocity (enhanced for clear visibility)
    primaryVelocity: new Vector3(0.03, 0.025, 0.035),
    
    // Oscillation parameters for natural variation
    oscillation: {
      amplitude: new Vector3(0.6, 0.4, 0.5), // amplitude for noticeable movement
      frequency: new Vector3(0.15, 0.20, 0.15), // Slightly faster frequency
      phase: new Vector3(0, Math.PI/3, Math.PI/2) // Phase offset for each axis
    },
    
    // Random perturbations for realistic motion
    perturbation: {
      strength: 0.10,
      frequency: 0.4
    }
  },
  
  // Drift boundaries (prevent galaxy from drifting too far)
  boundaries: {
    maxDistance: 2.5, // Increased max distance
    returnForce: 0.025  // Slightly stronger return force
  },
  
  // Visual feedback
  showTrail: true, // Enable trail for debugging (can be toggled)
  trailLength: 200   // Longer trail for better visualization
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

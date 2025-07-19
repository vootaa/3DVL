import type { TerrainConfig } from '../config/scene-config'

// Simple noise function (can be replaced with simplex-noise library)
export function noise2D(x: number, y: number): number {
  // Simple pseudo-random noise implementation
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1 // Return value between -1 and 1
}

// Advanced noise function combining multiple octaves
export function fractalNoise2D(x: number, y: number, octaves: number = 4): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0
  
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  
  return value / maxValue
}

// Smooth step function for transitions
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Calculate terrain height at given position
export function calculateTerrainHeight(x: number, z: number, config: TerrainConfig): number {
  const distance = Math.sqrt(x * x + z * z)
  
  // Plain area - flat with minimal noise
  if (distance <= config.plainRadius) {
    const plainNoise = fractalNoise2D(x * config.noiseScale * 0.5, z * config.noiseScale * 0.5, 2)
    return plainNoise * 0.1 // Very subtle height variation
  }
  
  // Transition area - gradual slope with noise
  if (distance <= config.transitionRadius) {
    const transitionFactor = smoothStep(
      config.plainRadius, 
      config.transitionRadius, 
      distance
    )
    
    const baseHeight = transitionFactor * config.transitionHeight
    const transitionNoise = fractalNoise2D(x * config.noiseScale, z * config.noiseScale, 3)
    
    return baseHeight + transitionNoise * config.noiseIntensity * transitionFactor
  }
  
  // Mountain area - steep terrain with ridge noise
  if (distance <= config.mountainRadius) {
    const mountainFactor = smoothStep(
      config.transitionRadius,
      config.mountainRadius,
      distance
    )
    
    const baseHeight = config.transitionHeight + mountainFactor * (config.maxHeight - config.transitionHeight)
    
    // Ridge noise for mountain features
    const ridgeNoise = fractalNoise2D(x * config.ridgeNoiseScale, z * config.ridgeNoiseScale, 4)
    const detailNoise = fractalNoise2D(x * config.noiseScale * 2, z * config.noiseScale * 2, 3)
    
    return baseHeight + ridgeNoise * config.noiseIntensity * 2 + detailNoise * config.noiseIntensity * 0.5
  }
  
  // Outer area - blend to dome edge
  const outerFactor = smoothStep(config.mountainRadius, config.domeRadius, distance)
  const edgeHeight = config.maxHeight * (1 - outerFactor * 0.5) // Gradually lower towards edge
  
  const edgeNoise = fractalNoise2D(x * config.ridgeNoiseScale, z * config.ridgeNoiseScale, 2)
  return edgeHeight + edgeNoise * config.noiseIntensity
}

// Get terrain color based on height and position
export function getTerrainColor(height: number, distance: number, config: TerrainConfig): string {
  // Plain area - green grass
  if (distance <= config.plainRadius) {
    return '#2d5a27'
  }
  
  // Transition area - brown/green mix
  if (distance <= config.transitionRadius) {
    const factor = (distance - config.plainRadius) / (config.transitionRadius - config.plainRadius)
    return factor > 0.5 ? '#4a4a2a' : '#3d4a27'
  }
  
  // Mountain area - rock colors based on height
  if (height > config.maxHeight * 0.8) {
    return '#6b6b6b' // High peaks - gray stone
  } else if (height > config.maxHeight * 0.5) {
    return '#5a4a3a' // Mid-level - brown rock
  } else {
    return '#4a3a2a' // Lower mountains - dark brown
  }
}
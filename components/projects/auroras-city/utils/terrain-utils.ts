import type { TerrainConfig } from '../config/scene-config'

// Enhanced noise function with angular variation
export function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

// Angular noise for radial variation
export function angularNoise(angle: number, radius: number, scale: number = 1): number {
  const x = Math.cos(angle) * radius * scale
  const y = Math.sin(angle) * radius * scale
  return noise2D(x * 0.1, y * 0.1)
}

// Fractal noise with angular variation
export function fractalNoiseWithAngular(x: number, z: number, octaves: number = 4): number {
  const distance = Math.sqrt(x * x + z * z)
  const angle = Math.atan2(z, x)
  
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0
  
  for (let i = 0; i < octaves; i++) {
    // Base noise
    const baseNoise = noise2D(x * frequency * 0.01, z * frequency * 0.01)
    // Angular variation noise
    const angularVar = angularNoise(angle + i * 1.5, distance, frequency * 0.005)
    
    value += (baseNoise + angularVar * 0.5) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  
  return value / maxValue
}

// Smooth step function
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Enhanced terrain height calculation
export function calculateTerrainHeight(x: number, z: number, config: TerrainConfig): number {
  const distance = Math.sqrt(x * x + z * z)
  const angle = Math.atan2(z, x)
  
  // Plain area - flat with energy field undulations
  if (distance <= config.plainRadius) {
    //const energyWave = Math.sin(distance * 0.3 + angle * 2) * 0.05
    //const plainNoise = fractalNoiseWithAngular(x, z, 2) * 0.1
    //return energyWave + plainNoise
    return 0
  }
  
  // Transition area - rising hills with angular variation
  if (distance <= config.transitionRadius) {
    const transitionFactor = smoothStep(config.plainRadius, config.transitionRadius, distance)
    
    // Angular variation for asymmetric hills
    const angularVariation = angularNoise(angle, distance, 0.8) * 0.4
    const baseHeight = (transitionFactor * config.transitionHeight) * (1 + angularVariation)
    
    const terraceNoise = fractalNoiseWithAngular(x, z, 3)
    return Math.max(0, baseHeight + terraceNoise * config.noiseIntensity * transitionFactor)
  }
  
  // Mountain area - dramatic hills with high angular variation
  if (distance <= config.mountainRadius) {
    const mountainFactor = smoothStep(config.transitionRadius, config.mountainRadius, distance)
    
    // Strong angular variation for diverse mountain shapes
    const strongAngular = angularNoise(angle, distance, 1.2) * 0.8
    const ridgeAngular = angularNoise(angle * 3, distance, 0.5) * 0.3
    
    const baseHeight = config.transitionHeight + 
      mountainFactor * (config.maxHeight - config.transitionHeight) * (1 + strongAngular + ridgeAngular)
    
    const ridgeNoise = fractalNoiseWithAngular(x, z, 4)
    return Math.max(config.transitionHeight * 0.5, 
      baseHeight + ridgeNoise * config.noiseIntensity * 2)
  }
  
  // High mountain barrier - towering peaks for backdrop
  const edgeFactor = smoothStep(config.mountainRadius, config.domeRadius, distance)
  const dramaticHeight = config.maxHeight * 2 + edgeFactor * config.maxHeight // Very high peaks
  
  // Dramatic angular variation for varied skyline
  const skylineVariation = angularNoise(angle * 2, distance, 2.0) * 0.6
  const peakNoise = fractalNoiseWithAngular(x, z, 3)
  
  return dramaticHeight * (1 + skylineVariation) + peakNoise * config.noiseIntensity * 1.5
}

// Sci-fi energy color calculation
export function getEnergyColor(height: number, distance: number, config: TerrainConfig): {
  baseColor: string
  emissive: string
  energyIntensity: number
} {
  // Plain area - energy field colors
  if (distance <= config.plainRadius) {
    return {
      baseColor: '#1a2332',      // Dark blue-gray base
      emissive: '#00ffcc',       // Cyan energy
      energyIntensity: 0.3
    }
  }
  
  // Transition area - energy bleeding into terrain
  if (distance <= config.transitionRadius) {
    return {
      baseColor: '#2a1a32',      // Purple-gray
      emissive: '#6600ff',       // Purple energy
      energyIntensity: 0.2
    }
  }
  
  // Mountain area - crystalline formations
  if (distance <= config.mountainRadius) {
    if (height > config.maxHeight * 0.7) {
      return {
        baseColor: '#323232',    // Gray crystal
        emissive: '#ff3366',     // Red energy veins
        energyIntensity: 0.15
      }
    } else {
      return {
        baseColor: '#1a1a2a',    // Dark base
        emissive: '#3366ff',     // Blue energy
        energyIntensity: 0.1
      }
    }
  }
  
  // High mountain barrier - dramatic peaks
  return {
    baseColor: '#0a0a1a',        // Almost black
    emissive: '#ff6600',         // Orange energy
    energyIntensity: 0.05
  }
}
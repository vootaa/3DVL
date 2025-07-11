export interface LODLevel {
  particleCount?: number
  particleSize?: number
  maxDistance: number
  quality: 'high' | 'medium' | 'low' | 'minimal'
}

export const globalLODConfig = {
  stellar: {
    high: { particleSize: 1.0, maxDistance: 1000, quality: 'high' as const },
    medium: { particleSize: 0.8, maxDistance: 2000, quality: 'medium' as const },
    low: { particleSize: 0.6, maxDistance: 5000, quality: 'low' as const },
    minimal: { particleSize: 0.4, maxDistance: Infinity, quality: 'minimal' as const }
  },
  orbital: {
    high: { particleCount: 12000, particleSize: 15, maxDistance: 1000, quality: 'high' as const },
    medium: { particleCount: 8000, particleSize: 12, maxDistance: 2000, quality: 'medium' as const },
    low: { particleCount: 4000, particleSize: 8, maxDistance: 5000, quality: 'low' as const },
    minimal: { particleCount: 2000, particleSize: 6, maxDistance: Infinity, quality: 'minimal' as const }
  },
  tethers: {
    high: { particleCount: 32, particleSize: 8.0, maxDistance: 1000, quality: 'high' as const },
    medium: { particleCount: 16, particleSize: 6.0, maxDistance: 2000, quality: 'medium' as const },
    low: { particleCount: 8, particleSize: 4.0, maxDistance: 5000, quality: 'low' as const },
    minimal: { particleCount: 4, particleSize: 2.0, maxDistance: Infinity, quality: 'minimal' as const }
  }
}

export function getCurrentLODLevel(cameraDistance: number, componentType: keyof typeof globalLODConfig) {
  const config = globalLODConfig[componentType]
  
  if (cameraDistance <= config.high.maxDistance) return config.high
  if (cameraDistance <= config.medium.maxDistance) return config.medium  
  if (cameraDistance <= config.low.maxDistance) return config.low
  return config.minimal
}
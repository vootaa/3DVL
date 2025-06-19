import { generateNebulaHash } from '../utils/hash-utils'
import { SPACE_THEME_COLORS } from '../utils/constants'

export interface NebulaData {
  id: string
  colors: string[]
  pattern: 'spiral' | 'cloud' | 'ring' | 'burst'
  intensity: number
  size: number
  created: number
}

export class NebulaGenerator {
  private patterns = ['spiral', 'cloud', 'ring', 'burst'] as const
  private colorPalettes = Object.values(SPACE_THEME_COLORS.nebula)

  generateNebula(seed: string): NebulaData {
    const hash = generateNebulaHash(seed)
    const hashNum = parseInt(hash.slice(0, 8), 16)
    
    // Use hash to deterministically generate nebula properties
    const patternIndex = hashNum % this.patterns.length
    const colorCount = (hashNum % 3) + 2 // 2-4 colors
    const colors = this.selectColors(hashNum, colorCount)
    
    return {
      id: `NEB-${hash}`,
      colors,
      pattern: this.patterns[patternIndex],
      intensity: (hashNum % 50 + 50) / 100, // 0.5 - 1.0
      size: (hashNum % 300 + 100), // 100-400
      created: Date.now()
    }
  }

  private selectColors(seed: number, count: number): string[] {
    const colors: string[] = []
    const availableColors = [...this.colorPalettes]
    
    for (let i = 0; i < count; i++) {
      const index = (seed + i * 17) % availableColors.length
      colors.push(availableColors[index])
      availableColors.splice(index, 1)
    }
    
    return colors
  }

  generateCSS(nebula: NebulaData): string {
    const gradient = nebula.colors.join(', ')
    
    switch (nebula.pattern) {
      case 'spiral':
        return `conic-gradient(from ${nebula.intensity * 360}deg, ${gradient})`
      case 'cloud':
        return `radial-gradient(ellipse at center, ${gradient})`
      case 'ring':
        return `radial-gradient(circle, transparent 30%, ${gradient})`
      case 'burst':
        return `radial-gradient(circle at center, ${gradient})`
      default:
        return `linear-gradient(45deg, ${gradient})`
    }
  }
}

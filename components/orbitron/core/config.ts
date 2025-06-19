import { SPACE_THEME_COLORS, ANIMATION_DURATIONS } from '../utils/constants'

export interface OrbitronConfig {
  theme: {
    colors: typeof SPACE_THEME_COLORS
    animations: typeof ANIMATION_DURATIONS
  }
  storage: {
    prefix: string
    encryption: boolean
  }
  nebula: {
    maxSize: number
    compressionLevel: number
  }
}

export const DEFAULT_CONFIG: OrbitronConfig = {
  theme: {
    colors: SPACE_THEME_COLORS,
    animations: ANIMATION_DURATIONS
  },
  storage: {
    prefix: 'orbitron_',
    encryption: true
  },
  nebula: {
    maxSize: 1024 * 1024, // 1MB
    compressionLevel: 6
  }
}

export function createConfig(overrides?: Partial<OrbitronConfig>): OrbitronConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...overrides?.theme
    },
    storage: {
      ...DEFAULT_CONFIG.storage,
      ...overrides?.storage
    },
    nebula: {
      ...DEFAULT_CONFIG.nebula,
      ...overrides?.nebula
    }
  }
}

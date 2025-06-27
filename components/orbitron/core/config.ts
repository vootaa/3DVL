import type { OrbitronConfig } from '../types'

import { SPACE_THEME_COLORS, ANIMATION_DURATIONS } from '../utils/constants'
import { Logger } from '../../utils/logger'

export const DEFAULT_CONFIG: OrbitronConfig = {
  max_identities: 3,
  auto_sync: true,
  offline_cache: true,
  pin_required: false,
  storage: {
    prefix: 'orbitron_v2_',
    encryption: false // Simplified for demo, enable for production
  },
  theme: {
    colors: SPACE_THEME_COLORS,
    animations: ANIMATION_DURATIONS
  }
}

export function createConfig(overrides?: Partial<OrbitronConfig>): OrbitronConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    storage: {
      ...DEFAULT_CONFIG.storage,
      ...overrides?.storage
    },
    theme: {
      ...DEFAULT_CONFIG.theme,
      ...overrides?.theme
    }
  }
}

export function validateConfig(config: OrbitronConfig): boolean {
  // Validate max_identities
  if (config.max_identities < 1 || config.max_identities > 10) {
    Logger.warn('Config', 'max_identities should be between 1 and 10')
    return false
  }

  // Validate storage prefix
  if (!config.storage.prefix || config.storage.prefix.length < 3) {
    Logger.warn('Config', 'storage.prefix should be at least 3 characters')
    return false
  }

  return true
}

export { type OrbitronConfig }

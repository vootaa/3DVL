export const SPACE_THEME_COLORS = {
  orbitron: {
    dark: '#0a0a0f',
    primary: '#1a1a2e', 
    secondary: '#16213e',
    accent: '#0f3460',
    neon: '#00d4ff'
  },
  nebula: {
    purple: '#8b5cf6',
    blue: '#3b82f6',
    cyan: '#06b6d4',
    pink: '#ec4899'
  }
} as const

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500
} as const

export const CRYPTO_CONSTANTS = {
  SALT_ROUNDS: 12,
  KEY_LENGTH: 32,
  IV_LENGTH: 16
} as const
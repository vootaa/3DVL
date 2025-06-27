/**
 * Generate a unique Nebula ID
 * Format: NEB-A1B2C3D4 (8 hexadecimal digits)
 */
export function generateNebulaId(): string {
  const chars = '0123456789ABCDEF'
  let result = 'NEB-'
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Generate a user-friendly Nebula nickname
 * Human-readable rule: Emoji + 3 letters + 2 numbers
 * Format: 🚀ABC12
 */
export function generateNebulaNickname(): string {
  const emojis = ['🚀', '⭐', '🌟', '💫', '🌌', '🛸', '🔮', '✨', '🌠', '⚡']
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  
  let nickname = emoji
  
  // Add 3 letters
  for (let i = 0; i < 3; i++) {
    nickname += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  // Add 2 numbers
  for (let i = 0; i < 2; i++) {
    nickname += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return nickname
}

/**
 * Generate a cryptographic seed for backend verification
 */
export function generateSeed(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `SES-${timestamp}-${randomPart}`.toUpperCase()
}

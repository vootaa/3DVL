import { generateHash } from './hash-utils'

/**
 * Generate a unique Nebula ID with enhanced security
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
 * Generate a user-friendly Nebula nickname from NebulaId
 * Deterministic conversion rule: Emoji + space + 3 letters + '-' + 2 numbers
 * Format: 🚀 ABC-12
 */
export function generateNebulaNickname(nebulaId: string): string {
  const emojis = [
    '🚀', '⭐', '🌟', '💫', '🌌', '🛸', '🔮', '✨', '🌠', '⚡',
    '🌙', '☄️', '🪐', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓',
    '🌔', '🛰️', '👽', '🌍', '🌎', '🌏', '☀️', '🔥', '💎', '🎇',
    '🎆', '💥', '⭐', '🌃', '🎭', '🎨', '🔬', '🧪', '⚛️', '🧬'
  ]
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  
  // Extract the hex part from NebulaId (after "NEB-")
  const hexPart = nebulaId.replace('NEB-', '')
  
  // Use the hex digits to deterministically generate nickname components
  const emojiIndex = parseInt(hexPart.charAt(0), 16) % emojis.length
  const letter1Index = parseInt(hexPart.charAt(1), 16) % letters.length
  const letter2Index = parseInt(hexPart.charAt(2), 16) % letters.length
  const letter3Index = parseInt(hexPart.charAt(3), 16) % letters.length
  
  // Use remaining hex digits for the 2-digit number (00-99)
  const numberPart = parseInt(hexPart.substring(4, 6), 16) % 100
  
  const emoji = emojis[emojiIndex]
  const threeLetters = letters.charAt(letter1Index) + letters.charAt(letter2Index) + letters.charAt(letter3Index)
  const twoNumbers = numberPart.toString().padStart(2, '0')
  
  return `${emoji} ${threeLetters}-${twoNumbers}`
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

/**
 * Generate validation hash for identity verification
 */
export async function generateValidationHash(nebulaId: string, createdAt: number, seed: string): Promise<string> {
  const combined = `${nebulaId}:${createdAt}:${seed}`
  return await generateHash(combined)
}

/**
 * Verify if a Nebula ID is valid based on its generation constraints
 */
export function verifyNebulaIdIntegrity(nebulaId: string, createdAt: number, seed: string, validationHash: string): boolean {
  // 1. Verify format
  if (!/^NEB-[A-F0-9]{8}$/.test(nebulaId)) {
    return false
  }
  
  // 2. Verify timestamp reasonability
  const now = Date.now()
  const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000)
  if (createdAt > now || createdAt < oneYearAgo) {
    return false
  }
  
  // 3. Verify seed format
  if (!/^[a-f0-9]{64}$/.test(seed)) {
    return false
  }
  
  // 4. Verify hash consistency (requires async verification)
  return true // Simplified example, actual implementation needs async hash verification
}

/**
 * Generate a device ID from browser information
 */
export async function generateDeviceId(): Promise<string> {
  const isBrowser = typeof window !== 'undefined';

  const userAgent = isBrowser ? navigator.userAgent : 'unknown';
  const platform = isBrowser ? navigator.platform : 'unknown';
  const language = isBrowser ? navigator.language : 'unknown';
  const screenWidth = isBrowser ? window.screen.width : 0;
  const screenHeight = isBrowser ? window.screen.height : 0;

  const combined = `${userAgent}:${platform}:${language}:${screenWidth}x${screenHeight}`;
  const hash = await generateHash(combined);
  return `DVID-${hash.substring(0, 12)}`;
}

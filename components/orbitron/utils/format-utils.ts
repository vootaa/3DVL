import { SPACE_GAME_FONTS } from './constants'

export function formatSpaceText(text: string, _variant: 'primary' | 'secondary' = 'primary'): string {
  return text.toUpperCase()
}

/**
 * Format timestamp with concise relative time expressions
 * @param timestamp Unix timestamp in milliseconds
 * @param fullDate Whether to show full date format (default: true)
 * @returns Formatted time string
 */
export function formatTimestamp(timestamp: number, fullDate: boolean = true): string {
  if (!timestamp) return 'Unknown'
  
  if (fullDate) {
    return new Date(timestamp).toLocaleString()
  }
  
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (seconds < 60) return 'now'
  if (minutes < 60) return `${minutes}m+`
  if (hours < 24) return `${hours}h+`
  if (days < 7) return `${days}d+`
  if (weeks < 4) return `${weeks}w+`
  if (months < 12) return `${months}mo+`
  
  // For older than 12 months, show full date
  return new Date(timestamp).toLocaleDateString()
}

/**
 * Format Nebula ID for display
 * @param id Full nebula ID
 * @returns Formatted ID string
 */
export function formatNebulaId(id: string): string {
  return id.replace('NEB-', '').substring(0, 8)
}

/**
 * Format Nebula Nickname for display
 */
export function formatNebulaNickname(nickname: string): string {
  return nickname.toUpperCase()
}

export function formatEventType(eventType: string): string {
  const typeMap: Record<string, string> = {
    'exploration': 'Exploration',
    'achievement': 'Achievement',
    'interaction': 'Interaction',
    'progress': 'Progress'
  }
  
  return typeMap[eventType] || eventType
}

/**
 * Format identity type for display
 */
export function formatIdentityType(identityType: string): string {
  const typeMap: Record<string, string> = {
    'main': 'Main Identity',
    'test': 'Test Identity',
    'private': 'Private Identity'
  }
  
  return typeMap[identityType] || identityType
}

/**
 * Format sync status for display
 */
export function formatSyncStatus(lastSync: number): string {
  if (!lastSync) return 'Never synced'
  
  const now = Date.now()
  const diff = now - lastSync

  if (diff < 60000) return 'Just synced now'
  if (diff < 3600000) return `Synced ${Math.floor(diff / 60000)} minutes ago`
  if (diff < 86400000) return `Synced ${Math.floor(diff / 3600000)} hours ago`
  
  return `Synced on ${new Date(lastSync).toLocaleDateString('en-US')}`
}

export function getSpaceFontClass(variant: keyof typeof SPACE_GAME_FONTS): string {
  const fonts = {
    primary: 'font-mono tracking-wider',
    secondary: 'font-mono tracking-widest'
  }
  return fonts[variant]
}

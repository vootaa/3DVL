import { SPACE_GAME_FONTS } from './constants'

export function formatSpaceText(text: string, _variant: 'primary' | 'secondary' = 'primary'): string {
  return text.toUpperCase()
}

/**
 * Format Nebula ID for display - updated for new format
 */
export function formatNebulaId(id: string): string {
  // If already formatted, return as-is
  if (id.startsWith('NEB-')) {
    return id
  }
  
  // Legacy format conversion
  return `NEB-${id.slice(0, 8).toUpperCase()}`
}

/**
 * Format Nebula Nickname for display
 */
export function formatNebulaNickname(nickname: string): string {
  return nickname.toUpperCase()
}

/**
 * Format timestamp with more readable format
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  // If less than 1 minute ago
  if (diff < 60000) {
    return 'Just now'
  }
  
  // If less than 1 hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minutes ago`
  }
  
  // If less than 1 day ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hours ago`
  }
  
  // Otherwise show full date
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Format growth event type for display
 */
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
  
  if (diff < 60000) return 'Just synced'
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

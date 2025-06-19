import { SPACE_GAME_FONTS } from './constants'

export function formatSpaceText(text: string, variant: 'primary' | 'secondary' = 'primary'): string {
  return text.toUpperCase()
}

export function formatNebulaId(id: string): string {
  return `NEB-${id.slice(0, 8).toUpperCase()}`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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

export function getSpaceFontClass(variant: keyof typeof SPACE_GAME_FONTS): string {
  const fonts = {
    primary: 'font-mono tracking-wider',
    secondary: 'font-mono tracking-widest'
  }
  return fonts[variant]
}

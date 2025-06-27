import type { OrbitronConfig } from '../types'
import { Logger } from '../../utils/logger'

export class StorageEngine {
  constructor(private config: OrbitronConfig) { }

  private getKey(key: string): string {
    return `${this.config.storage.prefix}${key}`
  }

  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = this.getKey(key)

    try {
      if (this.config.storage.encryption) {
        // Use simple encryption for demo
        const jsonData = JSON.stringify(value)
        const encrypted = btoa(jsonData) // Simple base64 encoding
        localStorage.setItem(fullKey, encrypted)
      } else {
        localStorage.setItem(fullKey, JSON.stringify(value))
      }
    } catch (error) {
      Logger.error('StorageEngine', 'Failed to save data:', error)
      throw new Error('Storage operation failed')
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key)
    const stored = localStorage.getItem(fullKey)

    if (!stored) return null

    try {
      if (this.config.storage.encryption) {
        // Use simple decryption for demo
        const decoded = atob(stored)
        return JSON.parse(decoded)
      } else {
        return JSON.parse(stored)
      }
    } catch (error) {
      Logger.warn('StorageEngine', 'Failed to parse stored data:', error)
      return null
    }
  }

  remove(key: string): void {
    const fullKey = this.getKey(key)
    localStorage.removeItem(fullKey)
  }

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.config.storage.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  list(): string[] {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(this.config.storage.prefix))
      .map(key => key.replace(this.config.storage.prefix, ''))
  }

  // Get storage statistics
  getStats(): {
    total_keys: number
    total_size: number
    prefix: string
  } {
    const keys = this.list()
    let totalSize = 0

    keys.forEach(key => {
      const fullKey = this.getKey(key)
      const value = localStorage.getItem(fullKey)
      if (value) {
        totalSize += value.length
      }
    })

    return {
      total_keys: keys.length,
      total_size: totalSize,
      prefix: this.config.storage.prefix
    }
  }
}

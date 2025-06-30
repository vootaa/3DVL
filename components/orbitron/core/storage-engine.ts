import type { OrbitronConfig } from '../types'
import { Logger } from '../../utils/logger'

export class StorageEngine {
  constructor(private config: OrbitronConfig) { }

  private getKey(key: string): string {
    return `${this.config.storage.prefix}${key}`
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!import.meta.client) return;
    const fullKey = this.getKey(key)

    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage is not available')
      }

      const jsonData = JSON.stringify(value)
      
      // Check data size (localStorage has ~5-10MB limit)
      if (jsonData.length > 1024 * 1024) { // 1MB warning
        Logger.warn('StorageEngine', `Large data size: ${jsonData.length} bytes`)
      }

      if (this.config.storage.encryption) {
        // Use simple encryption for demo
        const encrypted = btoa(jsonData) // Simple base64 encoding
        localStorage.setItem(fullKey, encrypted)
      } else {
        localStorage.setItem(fullKey, jsonData)
      }
      
      Logger.log('StorageEngine', `Saved data to ${fullKey}`)
    } catch (error) {
      Logger.error('StorageEngine', `Failed to save data to ${fullKey}:`, error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          throw new Error('Storage quota exceeded. Please clear some data.')
        } else if (error.message.includes('localStorage')) {
          throw new Error('localStorage is not available. Please check browser settings.')
        }
      }
      
      throw new Error(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!import.meta.client) return null;
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
    if (!import.meta.client) return;
    const fullKey = this.getKey(key)
    localStorage.removeItem(fullKey)
  }

  clear(): void {
    if (!import.meta.client) return;
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.config.storage.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  list(): string[] {
    if (!import.meta.client) return [];
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
    if (!import.meta.client) {
      return { total_keys: 0, total_size: 0, prefix: this.config.storage.prefix };
    }
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

  // Storage health check
  async healthCheck(): Promise<boolean> {
    if (!import.meta.client) return false;
    try {
      const testKey = this.getKey('_health_check')
      const testValue = { test: Date.now() }
      
      // Try to write and read back
      await this.set('_health_check', testValue)
      const readBack = await this.get<typeof testValue>('_health_check')
      
      // Clean up test data
      this.remove('_health_check')
      
      return readBack !== null && readBack.test === testValue.test
    } catch (error) {
      Logger.error('StorageEngine', 'Health check failed:', error)
      return false
    }
  }
}

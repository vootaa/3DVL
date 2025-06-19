import type { OrbitronConfig } from './config'
import { cryptoEngine } from './crypto-engine'

export class StorageEngine {
  constructor(private config: OrbitronConfig) {}

  private getKey(key: string): string {
    return `${this.config.storage.prefix}${key}`
  }

  async set<T>(key: string, value: T): Promise<void> {
    const fullKey = this.getKey(key)
    
    if (this.config.storage.encryption && cryptoEngine.isReady()) {
      const encrypted = await cryptoEngine.encrypt(value)
      localStorage.setItem(fullKey, encrypted)
    } else {
      localStorage.setItem(fullKey, JSON.stringify(value))
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key)
    const stored = localStorage.getItem(fullKey)
    
    if (!stored) return null
    
    try {
      if (this.config.storage.encryption && cryptoEngine.isReady()) {
        return await cryptoEngine.decrypt<T>(stored)
      } else {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to parse stored data:', error)
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
}

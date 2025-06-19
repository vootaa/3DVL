import type { OrbitronConfig } from './config'
import { StorageEngine } from './storage-engine'
import { IdentityManager } from './identity-manager'
import { NebulaGenerator } from './nebula-generator'
import { cryptoEngine } from './crypto-engine'

export class OrbitronAPI {
  public storage: StorageEngine
  public identity: IdentityManager
  public nebula: NebulaGenerator
  
  private initialized = false

  constructor(private config: OrbitronConfig) {
    this.storage = new StorageEngine(config)
    this.identity = new IdentityManager(this.storage)
    this.nebula = new NebulaGenerator()
  }

  async initialize(password?: string): Promise<void> {
    if (password && this.config.storage.encryption) {
      await cryptoEngine.initialize(password)
    }
    this.initialized = true
  }

  isReady(): boolean {
    return this.initialized
  }

  async getSystemInfo() {
    return {
      version: '1.0.0',
      initialized: this.initialized,
      encryption: cryptoEngine.isReady(),
      identityCount: (await this.identity.listIdentities()).length,
      theme: this.config.theme.colors
    }
  }

  async export(): Promise<string> {
    const identities = await this.identity.listIdentities()
    const data = {
      version: '1.0.0',
      exported: Date.now(),
      identities,
      config: this.config
    }
    
    if (this.config.storage.encryption && cryptoEngine.isReady()) {
      return await cryptoEngine.encrypt(data)
    }
    
    return JSON.stringify(data)
  }

  async import(data: string): Promise<void> {
    let parsed: any
    
    try {
      if (this.config.storage.encryption && cryptoEngine.isReady()) {
        parsed = await cryptoEngine.decrypt(data)
      } else {
        parsed = JSON.parse(data)
      }
    } catch (error) {
      throw new Error('Invalid import data')
    }
    
    // Import identities
    if (parsed.identities) {
      for (const identity of parsed.identities) {
        await this.storage.set(`identity_${identity.id}`, identity)
      }
    }
  }
}

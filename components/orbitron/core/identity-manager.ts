import { generateShortId, generateHash } from '../utils/hash-utils'
import { formatNebulaId } from '../utils/format-utils'
import type { StorageEngine } from './storage-engine'

export interface NebulaIdentity {
  id: string
  name: string
  created: number
  hash: string
  metadata?: Record<string, any>
}

export class IdentityManager {
  constructor(private storage: StorageEngine) {}

  async createIdentity(name: string, metadata?: Record<string, any>): Promise<NebulaIdentity> {
    const id = generateShortId(12)
    const hash = await generateHash(`${name}-${Date.now()}-${id}`)
    
    const identity: NebulaIdentity = {
      id: formatNebulaId(id),
      name,
      created: Date.now(),
      hash,
      metadata
    }
    
    await this.storage.set(`identity_${identity.id}`, identity)
    return identity
  }

  async getIdentity(id: string): Promise<NebulaIdentity | null> {
    return await this.storage.get<NebulaIdentity>(`identity_${id}`)
  }

  async listIdentities(): Promise<NebulaIdentity[]> {
    const keys = this.storage.list()
    const identityKeys = keys.filter(key => key.startsWith('identity_'))
    
    const identities: NebulaIdentity[] = []
    for (const key of identityKeys) {
      const identity = await this.storage.get<NebulaIdentity>(key)
      if (identity) identities.push(identity)
    }
    
    return identities.sort((a, b) => b.created - a.created)
  }

  async removeIdentity(id: string): Promise<void> {
    this.storage.remove(`identity_${id}`)
  }
}

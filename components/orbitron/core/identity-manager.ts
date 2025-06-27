import type { NebulaIdentity, IdentityType } from '../types'
import type { StorageEngine } from './storage-engine'

import { generateNebulaId, generateNebulaNickname, generateSeed } from '../utils/generators'
import { Logger } from '../../utils/logger'

export class IdentityManager {
  private readonly maxIdentities = 3
  private identities: NebulaIdentity[] = []
  private activeIdentityId: string | null = null

  constructor(private storage: StorageEngine) {
    this.loadFromStorage()
  }

  /**
   * Create a new Nebula identity with new terminology
   */
  async createIdentity(type: IdentityType = 'main'): Promise<NebulaIdentity> {
    if (this.identities.length >= this.maxIdentities) {
      throw new Error(`Maximum ${this.maxIdentities} identities allowed`)
    }

    // Check if identity of this type already exists
    if (this.identities.find(id => id.identity_type === type)) {
      throw new Error(`${type} identity already exists`)
    }

    const nebulaId = generateNebulaId()
    const identity: NebulaIdentity = {
      nebula_id: nebulaId,
      nebula_nickname: generateNebulaNickname(nebulaId),
      created_at: Date.now(),
      identity_type: type,
      generation_seed: generateSeed(),
      is_active: false
    }

    this.identities.push(identity)
    
    // Auto-activate first identity
    if (this.identities.length === 1) {
      this.activateIdentity(identity.nebula_id)
    }

    await this.saveToStorage()
    Logger.log('IdentityManager', `Created new identity: ${identity.nebula_nickname} (${identity.nebula_id})`)
    
    return identity
  }

  /**
   * Get active identity
   */
  getActiveIdentity(): NebulaIdentity | null {
    if (!this.activeIdentityId) return null
    return this.identities.find(id => id.nebula_id === this.activeIdentityId) || null
  }

  /**
   * Activate an identity
   */
  async activateIdentity(nebulaId: string): Promise<boolean> {
    const identity = this.identities.find(id => id.nebula_id === nebulaId)
    if (!identity) return false

    // Deactivate all others
    this.identities.forEach(id => id.is_active = false)
    
    // Activate selected
    identity.is_active = true
    this.activeIdentityId = nebulaId
    
    await this.saveToStorage()
    Logger.log('IdentityManager', `Activated identity: ${identity.nebula_nickname}`)
    
    return true
  }

  /**
   * Get all identities
   */
  getAllIdentities(): NebulaIdentity[] {
    return [...this.identities]
  }

  /**
   * Delete an identity
   */
  async deleteIdentity(nebulaId: string): Promise<boolean> {
    const index = this.identities.findIndex(id => id.nebula_id === nebulaId)
    if (index === -1) return false

    const wasActive = this.activeIdentityId === nebulaId
    this.identities.splice(index, 1)

    if (wasActive && this.identities.length > 0) {
      await this.activateIdentity(this.identities[0].nebula_id)
    } else if (this.identities.length === 0) {
      this.activeIdentityId = null
    }

    await this.saveToStorage()
    Logger.log('IdentityManager', `Deleted identity: ${nebulaId}`)
    
    return true
  }

  /**
   * Import identity from JSON
   */
  async importIdentity(identityJson: string): Promise<NebulaIdentity> {
    try {
      const identity: NebulaIdentity = JSON.parse(identityJson)
      
      // Validate structure
      if (!identity.nebula_id || !identity.nebula_nickname || !identity.generation_seed) {
        throw new Error('Invalid identity format')
      }

      // Check for duplicates
      if (this.identities.find(id => id.nebula_id === identity.nebula_id)) {
        throw new Error('Identity already exists')
      }

      if (this.identities.length >= this.maxIdentities) {
        throw new Error(`Maximum ${this.maxIdentities} identities allowed`)
      }

      identity.is_active = false
      this.identities.push(identity)
      await this.saveToStorage()
      
      Logger.log('IdentityManager', `Imported identity: ${identity.nebula_nickname}`)
      return identity
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to import identity: ${errorMessage}`)
    }
  }

  /**
   * Export identity to JSON
   */
  exportIdentity(nebulaId: string): string {
    const identity = this.identities.find(id => id.nebula_id === nebulaId)
    if (!identity) {
      throw new Error('Identity not found')
    }

    // Create export copy without active status
    const exportData = { ...identity, is_active: false }
    return JSON.stringify(exportData, null, 2)
  }

  private async saveToStorage(): Promise<void> {
    const data = {
      identities: this.identities,
      activeIdentityId: this.activeIdentityId,
      version: '2.0.0'
    }
    
    await this.storage.set('orbitron_identities', data)
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await this.storage.get<any>('orbitron_identities')
      if (!data) return

      this.identities = data.identities || []
      this.activeIdentityId = data.activeIdentityId || null
    } catch (error) {
      Logger.warn('IdentityManager', 'Failed to load identities from storage:', error)
      this.identities = []
      this.activeIdentityId = null
    }
  }
}


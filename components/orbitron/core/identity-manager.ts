import type { NebulaIdentity, IdentityType, ExportedIdentityData } from '../types'
import type { StorageEngine } from './storage-engine'

import { generateNebulaId, generateSeed, generateValidationHash, verifyNebulaIdIntegrity } from '../utils/generators'
import { Logger } from '../../utils/logger'

export class IdentityManager {
  private readonly maxIdentities = 3
  private identities: NebulaIdentity[] = []
  private activeIdentityId: string | null = null

  constructor(private storage: StorageEngine) {
    if (import.meta.client) {
      this.loadFromStorage()
    }
  }

  /**
   * Create a new Nebula identity
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
    const createdAt = Date.now()
    const generationSeed = generateSeed()
    
    const identity: NebulaIdentity = {
      nebula_id: nebulaId,
      created_at: createdAt,
      identity_type: type,
      generation_seed: generationSeed,
      is_active: false
    }

    this.identities.push(identity)
    
    // Auto-activate first identity
    if (this.identities.length === 1) {
      this.activateIdentity(identity.nebula_id)
    }

    await this.saveToStorage()
    Logger.log('IdentityManager', `Created new identity: ${identity.nebula_id} (${type})`)
    
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
    Logger.log('IdentityManager', `Activated identity: ${identity.nebula_id}`)
    
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
   * Import identity from JSON - verify integrity
   */
  async importIdentity(identityJson: string, targetType: IdentityType): Promise<NebulaIdentity> {
    try {
      const exportedData: ExportedIdentityData = JSON.parse(identityJson)
      
      // 1. Verify structure
      if (!exportedData.nebula_id || !exportedData.generation_seed || !exportedData.validation_hash) {
        throw new Error('Invalid identity format - missing required fields')
      }

      // 2. Verify integrity
      if (!verifyNebulaIdIntegrity(
        exportedData.nebula_id, 
        exportedData.created_at, 
        exportedData.generation_seed, 
        exportedData.validation_hash
      )) {
        throw new Error('Identity verification failed - invalid or forged identity')
      }

      // 3. Verify hash
      const expectedHash = await generateValidationHash(
        exportedData.nebula_id, 
        exportedData.created_at, 
        exportedData.generation_seed
      )
      if (expectedHash !== exportedData.validation_hash) {
        throw new Error('Identity verification failed - hash mismatch')
      }

      // 4. Check for duplicates
      if (this.identities.find(id => id.nebula_id === exportedData.nebula_id)) {
        throw new Error('Identity already exists')
      }

      // 5. Check if type slot is already occupied
      if (this.identities.find(id => id.identity_type === targetType)) {
        throw new Error(`${targetType} identity slot already occupied`)
      }

      if (this.identities.length >= this.maxIdentities) {
        throw new Error(`Maximum ${this.maxIdentities} identities allowed`)
      }

      // 6. Create identity (identity_type determined by import position)
      const identity: NebulaIdentity = {
        nebula_id: exportedData.nebula_id,
        created_at: exportedData.created_at,
        identity_type: targetType, // Determined by import button position
        generation_seed: exportedData.generation_seed,
        is_active: false
      }

      this.identities.push(identity)
      await this.saveToStorage()
      
      Logger.log('IdentityManager', `Imported identity: ${identity.nebula_id} as ${targetType}`)
      return identity
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to import identity: ${errorMessage}`)
    }
  }

  /**
   * Export identity to JSON
   */
  async exportIdentity(nebulaId: string): Promise<string> {
    const identity = this.identities.find(id => id.nebula_id === nebulaId)
    if (!identity) {
      throw new Error('Identity not found')
    }

    // Generate validation hash
    const validationHash = await generateValidationHash(
      identity.nebula_id,
      identity.created_at,
      identity.generation_seed
    )

    const exportData: ExportedIdentityData = {
      nebula_id: identity.nebula_id,
      created_at: identity.created_at,
      generation_seed: identity.generation_seed,
      validation_hash: validationHash
    }

    return JSON.stringify(exportData, null, 2)
  }

  private async saveToStorage(): Promise<void> {
    const data = {
      identities: this.identities,
      activeIdentityId: this.activeIdentityId,
      version: '0.2.1'
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


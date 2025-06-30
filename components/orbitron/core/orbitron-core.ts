import type { NebulaIdentity, GameGrowthEvent, EventType, IdentityType, OrbitronConfig } from '../types'

import { createConfig } from './config'
import { IdentityManager } from './identity-manager'
import { GrowthRecorder } from './growth-recorder'
import { PinManager } from './pin-manager'
import { StorageEngine } from './storage-engine'
import { CosmionClient } from '../clients/cosmion-client'
import { generateDeviceId } from '../utils/generators'
import { Logger } from '../../utils/logger'

export class OrbitronCore {
    private identityManager: IdentityManager
    private growthRecorder: GrowthRecorder
    private pinManager: PinManager
    private storage: StorageEngine
    private cosmionClient: CosmionClient
    private deviceId: string | null = null

    private initialized = false

    constructor(config?: Partial<OrbitronConfig>) {
        Logger.log('OrbitronCore', 'Initializing core system...')

        const fullConfig = createConfig(config)
        this.storage = new StorageEngine(fullConfig)
        this.identityManager = new IdentityManager(this.storage)
        this.growthRecorder = new GrowthRecorder(this.storage)
        this.pinManager = new PinManager(this.storage)
        this.cosmionClient = new CosmionClient()
    }

    async init(): Promise<void> {
        if (this.initialized) return
        if (import.meta.client) {
            await this.initializeDeviceId()
        }
        this.initialized = true
        Logger.log('OrbitronCore', '✅ Core system initialization complete')
    }

    private async initializeDeviceId() {
        let deviceId = await this.storage.get<string>('orbitron_device_id');
        if (!deviceId) {
            deviceId = await generateDeviceId();
            await this.storage.set('orbitron_device_id', deviceId);
            Logger.log('OrbitronCore', `New Device ID generated and stored: ${deviceId}`);
        } else {
            Logger.log('OrbitronCore', `Retrieved Device ID from storage: ${deviceId}`);
        }
        this.deviceId = deviceId;
    }

    // Identity Management
    async createIdentity(type: IdentityType = 'main'): Promise<NebulaIdentity> {
        if (this.isSystemLocked()) {
            throw new Error('System is locked')
        }
        return await this.identityManager.createIdentity(type)
    }

    getAllIdentities(): NebulaIdentity[] {
        return this.identityManager.getAllIdentities()
    }

    getActiveIdentity(): NebulaIdentity | null {
        return this.identityManager.getActiveIdentity()
    }

    async activateIdentity(nebulaId: string): Promise<boolean> {
        if (this.isSystemLocked()) {
            throw new Error('System is locked')
        }
        return await this.identityManager.activateIdentity(nebulaId)
    }

    async deleteIdentity(nebulaId: string): Promise<boolean> {
        if (this.isSystemLocked()) {
            throw new Error('System is locked')
        }

        // Clear growth events for deleted identity
        await this.growthRecorder.clearEventsForIdentity(nebulaId)

        return await this.identityManager.deleteIdentity(nebulaId)
    }

    async importIdentity(identityJson: string, targetType: IdentityType): Promise<NebulaIdentity> {
        if (this.isSystemLocked()) {
            throw new Error('System is locked')
        }
        return await this.identityManager.importIdentity(identityJson, targetType)
    }

    exportIdentity(nebulaId: string): Promise<string> {
        return this.identityManager.exportIdentity(nebulaId)
    }

    // PIN Management
    async setupPin(pin: string): Promise<void> {
        await this.pinManager.setupPin(pin)
    }

    async verifyPin(pin: string): Promise<boolean> {
        return await this.pinManager.verifyPin(pin)
    }

    async lock(): Promise<void> {
        await this.pinManager.lock()
    }

    async removePin(currentPin: string): Promise<void> {
        await this.pinManager.removePin(currentPin)
    }

    hasPinConfigured(): boolean {
        return this.pinManager.hasPinConfigured()
    }

    isSystemLocked(): boolean {
        return this.pinManager.isSystemLocked()
    }

    // Game Growth Recording
    async recordGameGrowth(
        nebulaId: string,
        experiment: string,
        eventType: EventType,
        action: string,
        growthData: Record<string, any> = {}
    ): Promise<GameGrowthEvent> {
        if (!this.deviceId) {
            throw new Error('Device ID not initialized')
        }
        return await this.growthRecorder.recordEvent(nebulaId, this.deviceId, experiment, eventType, action, growthData)
    }

    startNewSession(): string {
        return this.growthRecorder.startNewSession()
    }

    getGrowthEvents(nebulaId?: string): GameGrowthEvent[] {
        if (nebulaId) {
            return this.growthRecorder.getEventsForIdentity(nebulaId)
        }
        return this.growthRecorder.getAllEvents()
    }

    // Cosmion Integration
    async syncToCosmion(): Promise<{
        identities_synced: number
        events_synced: number
        success: boolean
    }> {
        const identities = this.identityManager.getAllIdentities()
        const events = this.growthRecorder.getAllEvents()

        return await this.cosmionClient.fullSync(identities, events)
    }

    isCosmionConnected(): boolean {
        return this.cosmionClient.isConnectionActive()
    }

    getLastSyncTime(): number {
        return this.cosmionClient.getLastSyncTime()
    }

    // System Information
    getSystemInfo(): {
        version: string
        initialized: boolean
        total_identities: number
        active_identity: string | null
        total_events: number
        pin_configured: boolean
        system_locked: boolean
        cosmion_connected: boolean
        last_sync: number
        deviceId: string | null
    } {
        const activeIdentity = this.getActiveIdentity()

        return {
            version: '2.0.0',
            initialized: this.initialized,
            total_identities: this.identityManager.getAllIdentities().length,
            active_identity: activeIdentity ? activeIdentity.nebula_id : null,
            total_events: this.growthRecorder.getAllEvents().length,
            pin_configured: this.pinManager.hasPinConfigured(),
            system_locked: this.pinManager.isSystemLocked(),
            cosmion_connected: this.cosmionClient.isConnectionActive(),
            last_sync: this.cosmionClient.getLastSyncTime(),
            deviceId: this.deviceId
        }
    }

    // Storage health check
    async checkStorageHealth(): Promise<boolean> {
        return await this.storage.healthCheck()
    }

    isReady(): boolean {
        return this.initialized
    }
}

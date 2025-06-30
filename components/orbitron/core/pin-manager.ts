import type { StorageEngine } from './storage-engine'

import { generateHash } from '../utils/hash-utils'
import { Logger } from '../../utils/logger'

export class PinManager {
    private pinHash: string | null = null
    private isLocked: boolean = false
    private failedAttempts: number = 0
    private readonly maxAttempts = 5
    private lockoutUntil: number = 0

    constructor(private storage: StorageEngine) {
        if (import.meta.client) {
            this.loadFromStorage()
        }
    }

    /**
     * Set up a new PIN
     */
    async setupPin(pin: string): Promise<void> {
        if (pin.length < 4 || pin.length > 8) {
            throw new Error('PIN must be 4-8 digits')
        }

        if (!/^\d+$/.test(pin)) {
            throw new Error('PIN must contain only numbers')
        }

        this.pinHash = await this.hashPin(pin)
        this.isLocked = false
        this.failedAttempts = 0
        this.lockoutUntil = 0

        await this.saveToStorage()
        Logger.log('PinManager', 'PIN protection enabled')
    }

    /**
     * Verify PIN and unlock if correct
     */
    async verifyPin(pin: string): Promise<boolean> {
        if (!this.pinHash) {
            throw new Error('No PIN configured')
        }

        if (this.isLockedOut()) {
            throw new Error(`Account locked. Try again after ${new Date(this.lockoutUntil).toLocaleTimeString()}`)
        }

        const isValid = await this.verifyPinHash(pin, this.pinHash)

        if (isValid) {
            this.isLocked = false
            this.failedAttempts = 0
            this.lockoutUntil = 0
            await this.saveToStorage()
            Logger.log('PinManager', 'Successfully unlocked')
            return true
        } else {
            this.failedAttempts++

            if (this.failedAttempts >= this.maxAttempts) {
                this.lockoutUntil = Date.now() + (15 * 60 * 1000) // 15 minutes lockout
                Logger.log('PinManager', 'Account locked due to failed attempts')
            }

            await this.saveToStorage()
            Logger.log('PinManager', `Invalid PIN. Attempts: ${this.failedAttempts}/${this.maxAttempts}`)
            return false
        }
    }

    /**
     * Lock the system
     */
    async lock(): Promise<void> {
        this.isLocked = true
        await this.saveToStorage()
        Logger.log('PinManager', 'System locked')
    }

    /**
     * Check if PIN is configured
     */
    hasPinConfigured(): boolean {
        return this.pinHash !== null
    }

    /**
     * Check if system is locked
     */
    isSystemLocked(): boolean {
        return this.isLocked || this.isLockedOut()
    }

    /**
     * Remove PIN protection
     */
    async removePin(currentPin: string): Promise<void> {
        if (!(await this.verifyPin(currentPin))) {
            throw new Error('Invalid current PIN')
        }

        this.pinHash = null
        this.isLocked = false
        this.failedAttempts = 0
        this.lockoutUntil = 0

        await this.saveToStorage()
        Logger.log('PinManager', 'PIN protection disabled')
    }

    /**
     * Change existing PIN
     * @future This method is reserved for future implementation.
     */
    async changePin(currentPin: string, newPin: string): Promise<void> {
        if (!(await this.verifyPin(currentPin))) {
            throw new Error('Invalid current PIN')
        }

        await this.setupPin(newPin)
        Logger.log('PinManager', 'PIN changed successfully')
    }

    /**
     * Get failed attempts count
     * @future This method is reserved for future implementation.
     */
    getFailedAttempts(): number {
        return this.failedAttempts
    }

    /**
     * Get remaining lockout time in milliseconds
     * @future This method is reserved for future implementation.
     */
    getRemainingLockoutTime(): number {
        if (!this.isLockedOut()) return 0
        return Math.max(0, this.lockoutUntil - Date.now())
    }

    private isLockedOut(): boolean {
        return this.lockoutUntil > Date.now()
    }

    private async hashPin(pin: string): Promise<string> {
        const salt = 'orbitron_salt_2024'
        return await generateHash(pin + salt)
    }

    private async verifyPinHash(pin: string, hash: string): Promise<boolean> {
        const computedHash = await this.hashPin(pin)
        return computedHash === hash
    }

    private async saveToStorage(): Promise<void> {
        const data = {
            pinHash: this.pinHash,
            isLocked: this.isLocked,
            failedAttempts: this.failedAttempts,
            lockoutUntil: this.lockoutUntil,
            version: '2.0.0'
        }

        await this.storage.set('orbitron_pin_data', data)
    }

    private async loadFromStorage(): Promise<void> {
        try {
            const data = await this.storage.get<any>('orbitron_pin_data')
            if (!data) return

            this.pinHash = data.pinHash || null
            this.isLocked = data.isLocked || false
            this.failedAttempts = data.failedAttempts || 0
            this.lockoutUntil = data.lockoutUntil || 0
        } catch (error) {
            Logger.warn('PinManager', 'Failed to load PIN data from storage:', error)
        }
    }
}

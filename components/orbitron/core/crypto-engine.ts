import { encryptData, decryptData } from '../utils/crypto-utils'
import { generateHash } from '../utils/hash-utils'

export class CryptoEngine {
  private isInitialized = false
  private masterKey: string = ''

  async initialize(password: string): Promise<void> {
    this.masterKey = await generateHash(password)
    this.isInitialized = true
  }

  async encrypt(data: any): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('CryptoEngine not initialized')
    }
    
    const jsonData = JSON.stringify(data)
    return await encryptData(jsonData, this.masterKey)
  }

  async decrypt<T>(encryptedData: string): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('CryptoEngine not initialized')
    }
    
    const decryptedData = await decryptData(encryptedData, this.masterKey)
    return JSON.parse(decryptedData)
  }

  async generateSecureId(): Promise<string> {
    const randomData = crypto.getRandomValues(new Uint8Array(16))
    const hashBuffer = await crypto.subtle.digest('SHA-256', randomData)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export const cryptoEngine = new CryptoEngine()

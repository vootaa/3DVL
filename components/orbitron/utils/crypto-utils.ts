import { CRYPTO_CONSTANTS } from './constants'

export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONSTANTS.IV_LENGTH))
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    encoder.encode(data)
  )
  
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  return btoa(String.fromCharCode(...result))
}

export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)))
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 16 + CRYPTO_CONSTANTS.IV_LENGTH)
  const encrypted = data.slice(16 + CRYPTO_CONSTANTS.IV_LENGTH)
  
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    derivedKey,
    encrypted
  )
  
  return decoder.decode(decrypted)
}

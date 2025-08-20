import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits for GCM

export function encrypt(text: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH)
  const key = Buffer.from(secret, 'utf-8').subarray(0, 32) // ensure 32 bytes

  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(enc: string, secret: string): string {
  const buf = Buffer.from(enc, 'base64')
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16)
  const encryptedText = buf.subarray(IV_LENGTH + 16)
  const key = Buffer.from(secret, 'utf-8').subarray(0, 32)

  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()])
  return decrypted.toString('utf8')
}

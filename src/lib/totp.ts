const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const TOTP_PERIOD = 30
const TOTP_DIGITS = 6
const RECOVERY_CODE_COUNT = 8

export function generateSecret(byteLength = 20): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  let bits = 0
  let value = 0
  let output = ""
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

export function base32Decode(secret: string): Uint8Array {
  const cleaned = secret.replace(/=+$/, "").replace(/\s/g, "").toUpperCase()
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}

export function formatSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim()
}

async function hmacSha1(keyBytes: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, message.buffer as ArrayBuffer)
  return new Uint8Array(signature)
}

export async function generateTOTP(secret: string, timestamp = Date.now()): Promise<string> {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD)
  const counterBytes = new Uint8Array(8)
  let temp = counter
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff
    temp = Math.floor(temp / 256)
  }
  const hash = await hmacSha1(base32Decode(secret), counterBytes)
  const offset = hash[hash.length - 1] & 0x0f
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  const otp = binary % Math.pow(10, TOTP_DIGITS)
  return otp.toString().padStart(TOTP_DIGITS, "0")
}

export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(normalized)) return false
  const now = Date.now()
  for (const drift of [-1, 0, 1]) {
    const timestamp = now + drift * TOTP_PERIOD * 1000
    const expected = await generateTOTP(secret, timestamp)
    if (expected === normalized) return true
  }
  return false
}

export function buildOtpauthUri(secret: string, account: string, issuer = "HoloStack"): string {
  const label = encodeURIComponent(`${issuer}:${account}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`
}

export function generateRecoveryCodes(): string[] {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_COUNT * 4))
  const codes: string[] = []
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const part1 = bytes[i * 4].toString(16).padStart(2, "0") + bytes[i * 4 + 1].toString(16).padStart(2, "0")
    const part2 = bytes[i * 4 + 2].toString(16).padStart(2, "0") + bytes[i * 4 + 3].toString(16).padStart(2, "0")
    codes.push(`${part1}-${part2}`.toUpperCase())
  }
  return codes
}

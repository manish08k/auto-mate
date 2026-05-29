const crypto = require("crypto");

const ALGORITHM  = "aes-256-gcm";
const KEY_HEX    = process.env.ENCRYPTION_KEY; // must be 64 hex chars = 32 bytes
const IV_LENGTH  = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

// ─── Validate key at startup ───────────────────────────────────────

if (!KEY_HEX || Buffer.from(KEY_HEX, "hex").length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes). " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

const ENCRYPTION_KEY = Buffer.from(KEY_HEX, "hex");

// ─── Encrypt ──────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * @param   {string} plaintext
 * @returns {string} encrypted string
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext;

  const iv     = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

// ─── Decrypt ──────────────────────────────────────────────────────

/**
 * Decrypts a string produced by encrypt().
 *
 * @param   {string} encryptedText  - format: <iv>:<authTag>:<ciphertext>
 * @returns {string} original plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format — expected iv:authTag:ciphertext");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  const iv         = Buffer.from(ivHex,         "hex");
  const authTag    = Buffer.from(authTagHex,    "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

// ─── Hash (one-way, for lookup tokens) ────────────────────────────

/**
 * Creates a non-reversible SHA-256 HMAC hash.
 * Use for webhook secret verification, API key hashing, etc.
 *
 * @param   {string} value
 * @returns {string} hex hash
 */
const hash = (value) => {
  return crypto
    .createHmac("sha256", ENCRYPTION_KEY)
    .update(String(value))
    .digest("hex");
};

/**
 * Timing-safe comparison of two strings/hashes.
 * Prevents timing attacks when comparing secrets.
 *
 * @param   {string} a
 * @param   {string} b
 * @returns {boolean}
 */
const safeCompare = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { encrypt, decrypt, hash, safeCompare };

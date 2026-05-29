import CryptoJS from 'crypto-js';

const SECRET = import.meta.env.VITE_ENCRYPT_SECRET ?? 'fallback-dev-secret';

const encrypt = {
  encode: (plaintext) => {
    if (!plaintext) return '';
    return CryptoJS.AES.encrypt(plaintext, SECRET).toString();
  },

  decode: (ciphertext) => {
    if (!ciphertext) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return '';
    }
  },

  hash: (value) => {
    if (!value) return '';
    return CryptoJS.SHA256(value).toString();
  },

  hmac: (value, secret = SECRET) => {
    if (!value) return '';
    return CryptoJS.HmacSHA256(value, secret).toString();
  },

  mask: (value, visibleEnd = 4) => {
    if (!value || value.length <= visibleEnd) return '••••••••';
    return '•'.repeat(value.length - visibleEnd) + value.slice(-visibleEnd);
  },

  isEncrypted: (value) => {
    if (!value || typeof value !== 'string') return false;
    try {
      const bytes = CryptoJS.AES.decrypt(value, SECRET);
      const decoded = bytes.toString(CryptoJS.enc.Utf8);
      return decoded.length > 0;
    } catch {
      return false;
    }
  },
};

export default encrypt;

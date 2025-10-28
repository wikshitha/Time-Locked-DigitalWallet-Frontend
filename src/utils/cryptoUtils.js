// frontend/src/utils/cryptoUtils.js
// Client-side crypto utilities using Web Crypto API
// - vaultKey: AES-KW 256 (used to wrap per-file content keys)
// - content key: AES-GCM 256 (used to encrypt file content)
// - encKey: wrapped content key (ArrayBuffer -> base64)
// - encryptedData: base64(iv + ciphertext)

const subtle = window.crypto.subtle;

//
// helpers: base64 <> ArrayBuffer
//
export const bufToBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const base64ToBuf = (b64) => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

//
// Vault key generation / import / export
// We'll store exported raw vaultKey in localStorage for the given vaultId
// - Key usage: ["wrapKey","unwrapKey"]
//
export const generateAndStoreVaultKey = async (vaultId) => {
  const key = await subtle.generateKey(
    { name: "AES-KW", length: 256 },
    true,
    ["wrapKey", "unwrapKey"]
  );
  const raw = await subtle.exportKey("raw", key);
  const b64 = bufToBase64(raw);
  localStorage.setItem(`vaultKey_${vaultId}`, b64);
  return key;
};

export const importVaultKey = async (vaultId) => {
  const b64 = localStorage.getItem(`vaultKey_${vaultId}`);
  if (!b64) return null;
  const raw = base64ToBuf(b64);
  const key = await subtle.importKey("raw", raw, "AES-KW", true, ["wrapKey", "unwrapKey"]);
  return key;
};

export const ensureVaultKey = async (vaultId) => {
  let key = await importVaultKey(vaultId);
  if (!key) {
    key = await generateAndStoreVaultKey(vaultId);
    console.warn(`Vault key generated and stored locally for vault ${vaultId}. Back it up securely!`);
  }
  return key;
};

//
// encryptFileForVault(file, vaultId)
// - returns { encryptedData: base64(iv + ciphertext), encKey: base64(wrappedContentKey) }
//
export const encryptFileForVault = async (file, vaultId) => {
  const vaultKey = await ensureVaultKey(vaultId);

  const contentKey = await subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const arrayBuffer = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv },
    contentKey,
    arrayBuffer
  );

  const wrappedKey = await subtle.wrapKey("raw", contentKey, vaultKey, { name: "AES-KW" });

  const ivAndCipher = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  ivAndCipher.set(iv, 0);
  ivAndCipher.set(new Uint8Array(cipherBuffer), iv.byteLength);

  return {
    encryptedData: bufToBase64(ivAndCipher.buffer),
    encKey: bufToBase64(wrappedKey),
  };
};

//
// decryptFileForVault(encryptedDataBase64, encKeyBase64, vaultId)
// - returns an ArrayBuffer with plaintext
//
export const decryptFileForVault = async (encryptedDataB64, encKeyB64, vaultId) => {
  const vaultKey = await importVaultKey(vaultId);
  if (!vaultKey) throw new Error("Vault key not found locally (cannot decrypt)");

  const wrappedBuf = base64ToBuf(encKeyB64);
  const contentKey = await subtle.unwrapKey(
    "raw",
    wrappedBuf,
    vaultKey,
    { name: "AES-KW" },
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );

  const combined = new Uint8Array(base64ToBuf(encryptedDataB64));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12).buffer;

  const plain = await subtle.decrypt({ name: "AES-GCM", iv }, contentKey, ciphertext);
  return plain;
};

//
// 🔐 Password-based encryption for vault key backup/restore
//

// derive AES-GCM key from password using PBKDF2
async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt vault key (Base64 string) using password
export async function encryptVaultKeyForBackup(vaultKeyB64, password) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(vaultKeyB64)
  );

  // combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

  return bufToBase64(combined.buffer);
}

// Decrypt vault key backup using password
export async function decryptVaultKeyFromBackup(encryptedB64, password) {
  const buf = base64ToBuf(encryptedB64);
  const salt = new Uint8Array(buf.slice(0, 16));
  const iv = new Uint8Array(buf.slice(16, 28));
  const ciphertext = buf.slice(28);
  const key = await deriveKeyFromPassword(password, salt);
  const decrypted = await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  const dec = new TextDecoder();
  return dec.decode(decrypted); // returns vaultKeyB64 string
}

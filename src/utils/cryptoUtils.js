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
    // IMPORTANT: inform user to back up this vault key securely in production
    console.warn(`Vault key generated and stored locally for vault ${vaultId}. Back it up securely!`);
  }
  return key;
};

//
// encryptFileForVault(file, vaultId)
// - returns { encryptedData: base64(iv + ciphertext), encKey: base64(wrappedContentKey) }
//
export const encryptFileForVault = async (file, vaultId) => {
  // ensure vaultKey exists (AES-KW)
  const vaultKey = await ensureVaultKey(vaultId);

  // generate content key (AES-GCM) for file encryption
  const contentKey = await subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // create 12-byte iv (recommended for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // encrypt file bytes with contentKey (AES-GCM)
  const cipherBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    contentKey,
    arrayBuffer
  );

  // wrap (encrypt) the contentKey with vaultKey using AES-KW
  // exportKey raw for contentKey and wrap (wrapKey supports passing CryptoKey directly)
  const wrappedKey = await subtle.wrapKey("raw", contentKey, vaultKey, { name: "AES-KW" });

  // package encryptedData: concat iv + ciphertext
  const ivAndCipher = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  ivAndCipher.set(iv, 0);
  ivAndCipher.set(new Uint8Array(cipherBuffer), iv.byteLength);

  return {
    encryptedData: bufToBase64(ivAndCipher.buffer), // base64 string
    encKey: bufToBase64(wrappedKey), // wrapped contentKey (base64)
  };
};

//
// decryptFileForVault(encryptedDataBase64, encKeyBase64, vaultId)
// - returns an ArrayBuffer with plaintext (for client-side decryption)
//
export const decryptFileForVault = async (encryptedDataB64, encKeyB64, vaultId) => {
  const vaultKey = await importVaultKey(vaultId);
  if (!vaultKey) throw new Error("Vault key not found locally (cannot decrypt)");

  // unwrap contentKey
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

  // split iv + ciphertext
  const combined = new Uint8Array(base64ToBuf(encryptedDataB64));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12).buffer;

  // decrypt
  const plain = await subtle.decrypt({ name: "AES-GCM", iv }, contentKey, ciphertext);
  return plain; // ArrayBuffer
};

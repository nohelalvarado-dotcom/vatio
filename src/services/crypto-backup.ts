/**
 * Password-authenticated AES-GCM encryption for backups using native Web Crypto API.
 * Password is never stored.
 */

export interface EncryptedBackupPayload {
  format: 'vatio_encrypted_v1';
  salt: string; // Base64
  iv: string;   // Base64
  ciphertext: string; // Base64
}

export async function encryptBackupWithPassword(
  jsonString: string,
  password: string
): Promise<EncryptedBackupPayload> {
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    aesKey,
    enc.encode(jsonString)
  );

  return {
    format: 'vatio_encrypted_v1',
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(new Uint8Array(encryptedBuffer)),
  };
}

export async function decryptBackupWithPassword(
  payload: EncryptedBackupPayload,
  password: string
): Promise<string> {
  if (payload.format !== 'vatio_encrypted_v1') {
    throw new Error('Formato de cifrado no reconocido.');
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    aesKey,
    ciphertext.buffer as ArrayBuffer
  );

  return dec.decode(decryptedBuffer);
}

function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

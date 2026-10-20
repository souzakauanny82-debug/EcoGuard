const crypto = require('crypto');

/**
 * Utilitários de Segurança e Criptografia de Senhas (RNF01)
 * Utiliza PBKDF2 com SHA-512 e salting aleatório por usuário.
 */

function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, key] = parts;
  try {
    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = Buffer.from(derivedKey, 'hex');
    if (keyBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch (err) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};

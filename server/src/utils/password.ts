import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, storedKey] = storedHash.split('$');
  if (algorithm !== 'scrypt') {
    const actual = Buffer.from(password);
    const expected = Buffer.from(storedHash);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  if (
    !salt ||
    !storedKey ||
    !/^[a-f\d]{32}$/i.test(salt) ||
    !/^[a-f\d]{128}$/i.test(storedKey)
  ) {
    return false;
  }

  const expectedKey = Buffer.from(storedKey, 'hex');
  const actualKey = (await scryptAsync(password, salt, expectedKey.length)) as Buffer;
  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}

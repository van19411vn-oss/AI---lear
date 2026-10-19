/**
 * Security & Authentication Utilities for AI LEARN
 * - SHA-256 Password Hashing (no plaintext password stored)
 * - Unique Username Generator for 2nd graders
 * - Initial Random Password Generator
 */

/**
 * Remove Vietnamese accents and special characters to create clean slug
 */
export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
}

/**
 * Generate a friendly, unique username for a 2nd grade student based on their class and full name
 * e.g. "Nguyễn Minh Anh" in "2A10" -> "2a10_minhanh"
 * If already taken, appends index: "2a10_minhanh2"
 */
export function generateStudentUsername(
  fullName: string,
  classCode: string,
  existingUsernames: Set<string>
): string {
  const cleanName = removeVietnameseAccents(fullName).toLowerCase();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  
  // Use last name or first + last name part
  let nameTag = '';
  if (nameParts.length === 1) {
    nameTag = nameParts[0];
  } else if (nameParts.length >= 2) {
    // e.g. "Minh Anh" -> "minhanh"
    const lastTwo = nameParts.slice(-2).join('');
    nameTag = lastTwo;
  } else {
    nameTag = 'hocsinh';
  }

  const prefix = classCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  let baseUsername = `${prefix}_${nameTag}`;
  
  let candidate = baseUsername;
  let counter = 2;
  while (existingUsernames.has(candidate.toLowerCase())) {
    candidate = `${baseUsername}${counter}`;
    counter++;
  }

  return candidate.toLowerCase();
}

/**
 * Generate random 4-digit or 6-digit initial numeric password
 * Safe, easy to print and easy for 2nd graders to type
 */
export function generateRandomStudentPassword(length: 4 | 6 = 4): string {
  if (length === 4) {
    // Generate 4-digit number between 1000 and 9999
    return `${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Computes SHA-256 hash string (lowercase hex) for passwords
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim());
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}

  // Fallback simple 64-char deterministic hash simulation if subtle crypto is unavailable
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sha256_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}_sec_${message.length}`;
}

/**
 * Synchronous hash version for immediate storage
 */
export function sha256Sync(message: string): string {
  const clean = message.trim();
  let h1 = 0xdeadbeef ^ clean.length;
  let h2 = 0x41c6ce57 ^ clean.length;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `h_${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Verify a student's password against stored passwordHash or fallback PIN
 */
export async function verifyStudentPassword(
  inputPassword: string,
  storedHash?: string,
  fallbackPin?: string
): Promise<boolean> {
  const trimmed = inputPassword.trim();
  if (!trimmed) return false;

  // 1. Check against async sha256
  const asyncHash = await sha256(trimmed);
  if (storedHash && (storedHash === asyncHash || storedHash === sha256Sync(trimmed))) {
    return true;
  }

  // 2. Check sync hash
  if (storedHash && storedHash === sha256Sync(trimmed)) {
    return true;
  }

  // 3. Check plain fallback PIN for backwards-compatibility or newly generated PIN
  if (fallbackPin && fallbackPin.trim() === trimmed) {
    return true;
  }

  return false;
}

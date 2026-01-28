/**
 * Admin Authentication Module
 *
 * Provides deterministic, env-based admin authentication with HMAC-signed sessions.
 * Uses WebCrypto for Edge middleware compatibility.
 *
 * Required Environment Variables:
 * - ADMIN_PASSWORD or ADMIN_TOKEN: The password/token for admin login
 * - ADMIN_SESSION_SECRET: Secret key for HMAC signing sessions (min 32 chars)
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Session configuration
const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
const SESSION_VERSION = "v1"; // For future session format changes

// ============================================================================
// Types
// ============================================================================

export interface AdminSession {
  version: string;
  issuedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
}

export interface SessionVerifyResult {
  valid: boolean;
  session?: AdminSession;
  error?: string;
}

// ============================================================================
// WebCrypto HMAC Utilities (Edge-compatible)
// ============================================================================

/**
 * Get the session secret from environment
 */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be set and at least 32 characters"
    );
  }
  return secret;
}

/**
 * Get the admin password/token from environment
 */
export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN;
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert string to ArrayBuffer (WebCrypto compatible)
 */
function stringToBuffer(str: string): ArrayBuffer {
  return stringToBytes(str).buffer as ArrayBuffer;
}

/**
 * Convert Uint8Array to base64url string
 */
function bytesToBase64Url(bytes: Uint8Array): string {
  const binString = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Convert base64url string to Uint8Array
 */
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binString = atob(padded);
  return Uint8Array.from(binString, (char) => char.charCodeAt(0));
}

/**
 * Create HMAC-SHA256 signature using WebCrypto
 */
async function createHmacSignature(
  data: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToBuffer(data)
  );

  return bytesToBase64Url(new Uint8Array(signature));
}

/**
 * Verify HMAC-SHA256 signature using WebCrypto
 */
async function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = base64UrlToBytes(signature);

  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes.buffer as ArrayBuffer,
    stringToBuffer(data)
  );
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create a signed admin session token
 * Format: payload.signature (both base64url encoded)
 */
export async function createAdminSession(): Promise<string> {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);

  const session: AdminSession = {
    version: SESSION_VERSION,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };

  const payload = bytesToBase64Url(stringToBytes(JSON.stringify(session)));
  const signature = await createHmacSignature(payload, secret);

  return `${payload}.${signature}`;
}

/**
 * Verify and decode an admin session token
 * Returns the session if valid, null otherwise
 */
export async function verifyAdminSessionToken(
  token: string
): Promise<SessionVerifyResult> {
  try {
    const secret = getSessionSecret();
    const parts = token.split(".");

    if (parts.length !== 2) {
      return { valid: false, error: "Invalid token format" };
    }

    const [payload, signature] = parts;

    // Verify signature
    const isValid = await verifyHmacSignature(payload, signature, secret);
    if (!isValid) {
      return { valid: false, error: "Invalid signature" };
    }

    // Decode payload
    const sessionJson = new TextDecoder().decode(base64UrlToBytes(payload));
    const session: AdminSession = JSON.parse(sessionJson);

    // Check version
    if (session.version !== SESSION_VERSION) {
      return { valid: false, error: "Session version mismatch" };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt < now) {
      return { valid: false, error: "Session expired" };
    }

    return { valid: true, session };
  } catch {
    return { valid: false, error: "Failed to parse session" };
  }
}

/**
 * Verify admin session from cookies (for use in Server Actions)
 * This is the main function to use in server actions
 */
export async function verifyAdminSession(): Promise<SessionVerifyResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return { valid: false, error: "No session cookie" };
  }

  return verifyAdminSessionToken(sessionCookie.value);
}

/**
 * Require admin authentication in server actions
 * Throws redirect to login page if not authenticated
 *
 * Usage in server actions:
 *   export async function myAdminAction() {
 *     await requireAdmin();
 *     // ... rest of action
 *   }
 */
export async function requireAdmin(): Promise<void> {
  const result = await verifyAdminSession();

  if (!result.valid) {
    redirect("/admin/login?error=unauthorized");
  }
}

/**
 * Set the admin session cookie
 * Call this after successful login
 */
export async function setAdminSessionCookie(): Promise<void> {
  const sessionToken = await createAdminSession();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clear the admin session cookie
 * Call this on logout
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verify password against ADMIN_PASSWORD/ADMIN_TOKEN
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyAdminPassword(provided: string): boolean {
  const expected = getAdminPassword();

  // In dev without password set, allow any login
  if (!expected && process.env.NODE_ENV !== "production") {
    return true;
  }

  if (!expected) {
    return false;
  }

  // Timing-safe comparison
  if (provided.length !== expected.length) {
    // Still do a comparison to maintain constant time
    let _result = 0;
    for (let i = 0; i < expected.length; i++) {
      _result |= expected.charCodeAt(i) ^ (provided.charCodeAt(i % provided.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Middleware Helper (Edge-compatible)
// ============================================================================

/**
 * Verify session from request cookies (for use in Edge middleware)
 * This is a standalone function that doesn't use next/headers
 */
export async function verifySessionFromRequest(
  cookieValue: string | undefined
): Promise<SessionVerifyResult> {
  if (!cookieValue) {
    return { valid: false, error: "No session cookie" };
  }

  return verifyAdminSessionToken(cookieValue);
}

/**
 * Get the session cookie name (for use in middleware)
 */
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

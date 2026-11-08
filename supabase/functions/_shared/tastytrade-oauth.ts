/**
 * AllBiz One tastytrade OAuth sandbox helpers.
 * Pure helpers only: no client secrets, no token exchange, no live orders.
 * Import on the SERVER, not in the public index.html.
 */
export const TASTYTRADE_SANDBOX_API = "https://api.cert.tastyworks.com";
export const TASTYTRADE_PRODUCTION_ENABLED = false;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generateRandomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

export function generatePkceVerifier(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

export async function generatePkceChallenge(verifier: string): Promise<string> {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
    throw new Error("Invalid PKCE verifier");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export function validateCallbackState(
  supplied: string | null,
  expected: string,
  createdAtMs: number,
  nowMs: number = Date.now(),
): boolean {
  if (!supplied || !/^[A-Za-z0-9_-]{43}$/.test(supplied)) return false;
  if (!expected || supplied.length !== expected.length) return false;
  if (!Number.isFinite(createdAtMs) || createdAtMs > nowMs || nowMs - createdAtMs > 300_000) return false;
  // Constant-time comparison of equal-length ASCII states.
  let mismatch = 0;
  for (let i = 0; i < supplied.length; i++) mismatch |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

/**
 * Required before using helpers in production:
 * - persist one-time state and PKCE verifier securely on the server, bound to authenticated user;
 * - consume state atomically exactly once, expire after 5 minutes;
 * - validate OAuth client configuration and exact redirect URI;
 * - perform token exchange and encrypted per-user storage server-side only;
 * - never expose tokens, authorization codes or secrets in browser or logs.
 */

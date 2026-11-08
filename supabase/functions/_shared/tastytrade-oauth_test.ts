import { assert, assertEquals } from "jsr:@std/assert@1.0.14";
import {
  generateRandomState,
  generatePkceVerifier,
  generatePkceChallenge,
  validateCallbackState,
  TASTYTRADE_PRODUCTION_ENABLED,
} from "./tastytrade-oauth.ts";

Deno.test("sandbox is never mistaken for live trading", () => {
  assertEquals(TASTYTRADE_PRODUCTION_ENABLED, false);
});

Deno.test("OAuth state is random, URL-safe and 256-bit", () => {
  const a = generateRandomState();
  const b = generateRandomState();
  assert(/^[A-Za-z0-9_-]{43}$/.test(a));
  assert(a !== b);
});

Deno.test("PKCE verifier and challenge have valid encoding", async () => {
  const verifier = generatePkceVerifier();
  const challenge = await generatePkceChallenge(verifier);
  assert(/^[A-Za-z0-9_-]{43}$/.test(verifier));
  assert(/^[A-Za-z0-9_-]{43}$/.test(challenge));
  assert(challenge !== verifier);
});

Deno.test("callback state expires after five minutes and rejects mismatch", () => {
  const state = generateRandomState();
  const now = Date.now();
  assert(validateCallbackState(state, state, now - 299_000, now));
  assertEquals(validateCallbackState(state, state, now - 301_000, now), false);
  assertEquals(validateCallbackState(generateRandomState(), state, now, now), false);
  assertEquals(validateCallbackState(null, state, now, now), false);
  assertEquals(validateCallbackState(state, state, now + 1, now), false);
});

Deno.test("PKCE invalid verifier is rejected", async () => {
  let rejected = false;
  try { await generatePkceChallenge("too-short"); } catch { rejected = true; }
  assert(rejected);
});

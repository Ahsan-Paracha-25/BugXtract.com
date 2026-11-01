import { env } from "./runtime-env";

const encoder = new TextEncoder();
const ITERATIONS = 100_000;
const SESSION_SECONDS = 12 * 60 * 60;
const COOKIE_NAME = "bugxtract_admin";

function encode64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decode64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function constantTimeEqual(a: string, b: string) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export function validUsername(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._-]{3,40}$/.test(value);
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 12 && value.length <= 128;
}

export async function hashPassword(password: string, salt: Uint8Array, iterations = ITERATIONS) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBytes = Uint8Array.from(salt);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes.buffer, iterations }, key, 256);
  return encode64Url(new Uint8Array(bits));
}

async function getRecord() {
  if (!env.DB) throw new Error("Admin database is unavailable.");
  return env.DB.prepare("SELECT username, salt, password_hash AS passwordHash, iterations, recovery_used AS recoveryUsed, updated_at AS updatedAt FROM admin_credentials WHERE id = 1")
    .first<{ username: string; salt: string; passwordHash: string; iterations: number; recoveryUsed: number; updatedAt: string }>();
}

export async function isAdminConfigured() {
  return Boolean(await getRecord());
}

async function hmac(value: string) {
  if (!env.ADMIN_SESSION_SECRET) throw new Error("Admin session secret is not configured.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(env.ADMIN_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return key;
}

export async function createSessionCookie(username: string) {
  const payload = encode64Url(encoder.encode(JSON.stringify({ username, expiresAt: Date.now() + SESSION_SECONDS * 1000 })));
  const key = await hmac(payload);
  const signature = encode64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

async function validSession(request: Request) {
  const raw = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  const [payload, signature, extra] = raw.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const key = await hmac(payload);
    const ok = await crypto.subtle.verify("HMAC", key, decode64Url(signature), encoder.encode(payload));
    if (!ok) return null;
    const session = JSON.parse(new TextDecoder().decode(decode64Url(payload))) as { username?: unknown; expiresAt?: unknown };
    if (!validUsername(session.username) || typeof session.expiresAt !== "number" || session.expiresAt <= Date.now()) return null;
    const record = await getRecord();
    return record?.username === session.username ? record.username : null;
  } catch { return null; }
}

export async function getAdminUsername(request: Request) {
  return validSession(request);
}

export function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}

async function ipKey(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  return encode64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(ip))));
}

export async function authRateLimited(request: Request) {
  if (!env.DB) throw new Error("Admin database is unavailable.");
  const key = await ipKey(request);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT blocked_until AS blockedUntil, window_started AS windowStarted FROM admin_auth_attempts WHERE ip_hash = ?")
    .bind(key).first<{ blockedUntil: number; windowStarted: number }>();
  if (!row) return false;
  if (row.blockedUntil > now) return true;
  if (now - row.windowStarted >= 900) {
    await env.DB.prepare("DELETE FROM admin_auth_attempts WHERE ip_hash = ?").bind(key).run();
  }
  return false;
}

export async function recordFailedAuth(request: Request) {
  if (!env.DB) throw new Error("Admin database is unavailable.");
  const key = await ipKey(request);
  const now = Math.floor(Date.now() / 1000);
  const existing = await env.DB.prepare("SELECT failures, window_started AS windowStarted, blocked_until AS blockedUntil FROM admin_auth_attempts WHERE ip_hash = ?")
    .bind(key).first<{ failures: number; windowStarted: number; blockedUntil: number }>();
  if (!existing) {
    await env.DB.prepare("INSERT INTO admin_auth_attempts (ip_hash, failures, window_started, blocked_until) VALUES (?, 1, ?, 0)")
      .bind(key, now).run();
    return;
  }
  const inWindow = now - existing.windowStarted < 900;
  const failures = inWindow ? existing.failures + 1 : 1;
  const windowStarted = inWindow ? existing.windowStarted : now;
  const blockedUntil = failures >= 5 ? now + 900 : (inWindow ? existing.blockedUntil : 0);
  await env.DB.prepare("UPDATE admin_auth_attempts SET failures = ?, window_started = ?, blocked_until = ? WHERE ip_hash = ?")
    .bind(failures, windowStarted, blockedUntil, key).run();
}

export async function clearFailedAuth(request: Request) {
  if (!env.DB) throw new Error("Admin database is unavailable.");
  await env.DB.prepare("DELETE FROM admin_auth_attempts WHERE ip_hash = ?").bind(await ipKey(request)).run();
}

export async function getCredentials() { return getRecord(); }


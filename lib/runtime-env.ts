// Unified runtime environment for Cloudflare preview and GoDaddy Node hosting.
// GoDaddy injects a compatible environment before the app handler is loaded.
import { env as cloudflareEnv } from "./runtime-env";

export const env = (globalThis as typeof globalThis & { __BUGXTRACT_ENV__?: Record<string, unknown> }).__BUGXTRACT_ENV__ ?? cloudflareEnv;


declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_SETUP_TOKEN?: string;
    ADMIN_RECOVERY_TOKEN?: string;
    ADMIN_SESSION_SECRET?: string;
  }
}

import http from "node:http";
import { mkdir, readFile, writeFile, unlink, readdir, stat } from "node:fs/promises";
import { join, basename, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = fileURLToPath(new URL("./public/assets/", import.meta.url));
const clientRoot = fileURLToPath(new URL("./dist/client/", import.meta.url));
const serverRoot = fileURLToPath(new URL("./dist/server/", import.meta.url));
const port = Number(process.env.PORT || 3000);
let pool;

async function getPool() {
  if (pool) return pool;
  if (!process.env.DB_HOST) return null;
  const mysql = await import("mysql2/promise");
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 5000,
    enableKeepAlive: true,
    charset: "utf8mb4",
  });
  return pool;
}

function mysqlSql(sql) {
  return sql
    .replace(/ON CONFLICT\s*\([^)]*\)\s*DO UPDATE SET/gi, "ON DUPLICATE KEY UPDATE")
    .replace(/excluded\.([a-zA-Z_][a-zA-Z0-9_]*)/g, "VALUES($1)");
}

function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("MySQL query timed out")), ms)),
  ]);
}

function database() {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          const p = await getPool(); if (!p) return null;
          const [rows] = await withTimeout(p.execute(mysqlSql(sql), values)); return rows[0] ?? null;
        },
        async all() {
          const p = await getPool(); if (!p) return { results: [] };
          const [rows] = await withTimeout(p.execute(mysqlSql(sql), values)); return { results: rows };
        },
        async run() {
          const p = await getPool(); if (!p) throw new Error("GoDaddy MySQL database is not configured");
          const [result] = await withTimeout(p.execute(mysqlSql(sql), values)); return { success: true, meta: result };
        },
      };
      return statement;
    },
  };
}

const pricingDetailDefaults = {
  plans: [
    { id: "free", audience: "Service evaluation", hours: "2 hours", description: "Try our manual QA approach on one critical user flow.", popular: false, features: ["One critical flow", "Focused checks", "1 configuration", "—", "—", "—", "Short findings report", "—", "Recommendations"] },
    { id: "starter", audience: "Small apps / websites", hours: "6–12 hours", description: "A practical QA pass for a small product or focused release.", popular: false, features: ["Core workflows", "Included", "2 configurations", "—", "—", "—", "Detailed report", "1 focused cycle", "Test checklist"] },
    { id: "professional", audience: "Medium applications", hours: "20–40 hours", description: "Broader coverage for growing applications and planned releases.", popular: true, features: ["Agreed feature scope", "Included", "Up to 4 configurations", "Included", "Core APIs", "On agreement", "Detailed report", "2 cycles", "Checklist & release summary"] },
    { id: "complete", audience: "Large enterprise apps", hours: "60–120 hours", description: "Risk-based testing across larger products and release scopes.", popular: false, features: ["Risk-based module coverage", "Included", "Agreed coverage matrix", "Included", "Agreed APIs & integrations", "Included in agreed scope", "Tracked defect reports", "Within reserved hours", "Test plan, cases & release assessment"] },
  ],
  retainers: [
    { id: "essential", hours: "20", price: "$450", description: "Maintenance checks, small updates, and focused bug verification." },
    { id: "growth", hours: "40", price: "$850", description: "Regular release cycles, regression coverage, and wider platform checks." },
    { id: "dedicated", hours: "80", price: "$1,600", description: "Frequent releases, deeper product context, and embedded collaboration." },
  ],
};

function enrichPricing(content) {
  const plans = Array.isArray(content?.plans) ? content.plans : [];
  const retainers = Array.isArray(content?.retainers) ? content.retainers : [];
  return {
    ...content,
    plans: plans.map(plan => ({ ...pricingDetailDefaults.plans.find(item => item.id === plan.id), ...plan, features: Array.isArray(plan.features) && plan.features.length ? plan.features : pricingDetailDefaults.plans.find(item => item.id === plan.id)?.features || [] })),
    retainers: retainers.map(plan => ({ ...pricingDetailDefaults.retainers.find(item => item.id === plan.id), ...plan })),
  };
}

const bucket = {
  async put(key, value) {
    await mkdir(root, { recursive: true });
    const safe = basename(key);
    const data = value instanceof ArrayBuffer ? Buffer.from(value) : Buffer.from(value);
    await writeFile(join(root, safe), data);
  },
  async get(key) {
    try { return { body: await readFile(join(root, basename(key))) }; } catch { return null; }
  },
  async delete(key) { try { await unlink(join(root, basename(key))); } catch {} },
  async list() { return { objects: (await readdir(root, { withFileTypes: true }).catch(() => [])).filter(x => x.isFile()).map(x => ({ key: x.name })) }; },
};

function env() {
  return {
    DB: database(),
    BUCKET: bucket,
    ADMIN_SETUP_TOKEN: process.env.ADMIN_SETUP_TOKEN,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_RECOVERY_TOKEN: process.env.ADMIN_RECOVERY_TOKEN,
  };
}

function json(res, status, value, headers = {}) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(body);
}

function cookieValue(req, name) {
  const value = String(req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : "";
}

function sessionToken(username) {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function sessionUsername(req) {
  const token = cookieValue(req, "bugxtract_admin");
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !process.env.ADMIN_SESSION_SECRET) return null;
  const expected = crypto.createHmac("sha256", process.env.ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.username === "string" && Number(data.expiresAt) > Date.now() ? data.username : null;
  } catch { return null; }
}

globalThis.__BUGXTRACT_ENV__ = env();
const { default: app } = await import("./dist/server/index.js");

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const contentTypes = { ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };

async function serveClientAsset(pathname, res) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  for (const base of [clientRoot, serverRoot]) {
    const file = normalize(join(base, relative));
    if (!file.startsWith(base)) continue;
    try {
      const info = await stat(file);
      if (!info.isFile()) continue;
      res.writeHead(200, { "content-type": contentTypes[extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" });
      res.end(await readFile(file));
      return true;
    } catch { /* try the other build root */ }
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
    const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost").split(",")[0].trim();
    const url = `${forwardedProto}://${forwardedHost}${req.url || "/"}`;
    const pathname = new URL(url).pathname;
    if (req.method === "GET" || req.method === "HEAD") {
      if (await serveClientAsset(pathname, res)) return;
    }

    if (pathname === "/api/admin/auth/status" && req.method === "GET") {
      const row = await database().prepare("SELECT username FROM admin_credentials WHERE id = 1").first();
      const username = sessionUsername(req);
      return json(res, 200, { configured: Boolean(row), authenticated: Boolean(username), username });
    }

    if (pathname === "/api/pricing" && req.method === "GET") {
      const row = await database().prepare("SELECT content FROM site_pricing WHERE id = 1").first();
      return json(res, 200, enrichPricing(row?.content ? JSON.parse(row.content) : { plans: [], retainers: [] }), { "cache-control": "no-store" });
    }

    if (pathname === "/api/reviews" && req.method === "GET") {
      const result = await database().prepare("SELECT id, customer_name AS customerName, role, company, headline, body, rating, image_key AS imageKey, updated_at AS updatedAt FROM customer_reviews WHERE published = 1 ORDER BY updated_at DESC").all();
      return json(res, 200, result.results.map(row => ({ ...row, imageUrl: row.imageKey ? `/api/reviews/images/${encodeURIComponent(row.imageKey)}` : "" })), { "cache-control": "no-store" });
    }

    if (pathname === "/api/admin/reviews" && req.method === "GET") {
      if (!sessionUsername(req)) return json(res, 401, { error: "Admin sign-in required." });
      const result = await database().prepare("SELECT id, customer_name AS customerName, role, company, headline, body, rating, image_key AS imageKey, published, created_at AS createdAt, updated_at AS updatedAt FROM customer_reviews ORDER BY updated_at DESC").all();
      return json(res, 200, result.results.map(row => ({ ...row, imageUrl: row.imageKey ? `/api/reviews/images/${encodeURIComponent(row.imageKey)}` : "" })), { "cache-control": "no-store" });
    }

    const request = new Request(url, { method: req.method, headers: req.headers, body });
    const response = await app.fetch(request, env(), { props: {}, waitUntil() {}, passThroughOnException() {} });
    const responseHeaders = Object.fromEntries(response.headers.entries());
    if (pathname === "/admin" || pathname === "/admin/") responseHeaders["cache-control"] = "no-store";
    res.writeHead(response.status, responseHeaders);
    if (req.method !== "HEAD") res.end(Buffer.from(await response.arrayBuffer())); else res.end();
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Application failed to start or handle this request." }));
  }
});

server.listen(port, "0.0.0.0", () => console.log(`BugXtract Node server listening on port ${port}`));






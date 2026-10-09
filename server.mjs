import http from "node:http";
import { mkdir, readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const { default: app } = await import("./dist/server/index.js");
const root = fileURLToPath(new URL("./public/assets/", import.meta.url));
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
    charset: "utf8mb4",
  });
  return pool;
}

function mysqlSql(sql) {
  return sql
    .replace(/ON CONFLICT\s*\([^)]*\)\s*DO UPDATE SET/gi, "ON DUPLICATE KEY UPDATE")
    .replace(/excluded\.([a-zA-Z_][a-zA-Z0-9_]*)/g, "VALUES($1)");
}

function database() {
  return {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) { values = args; return statement; },
        async first() {
          const p = await getPool(); if (!p) return null;
          const [rows] = await p.execute(mysqlSql(sql), values); return rows[0] ?? null;
        },
        async all() {
          const p = await getPool(); if (!p) return { results: [] };
          const [rows] = await p.execute(mysqlSql(sql), values); return { results: rows };
        },
        async run() {
          const p = await getPool(); if (!p) throw new Error("GoDaddy MySQL database is not configured");
          const [result] = await p.execute(mysqlSql(sql), values); return { success: true, meta: result };
        },
      };
      return statement;
    },
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
    const url = `http://${req.headers.host || "localhost"}${req.url || "/"}`;
    const request = new Request(url, { method: req.method, headers: req.headers, body });
    const response = await app.fetch(request, env(), { props: {}, waitUntil() {}, passThroughOnException() {} });
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (req.method !== "HEAD") res.end(Buffer.from(await response.arrayBuffer())); else res.end();
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Application failed to start or handle this request." }));
  }
});

server.listen(port, "0.0.0.0", () => console.log(`BugXtract Node server listening on port ${port}`));

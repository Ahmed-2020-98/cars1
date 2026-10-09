import mysql, { type Pool, type PoolConnection } from "mysql2/promise";

const schema = [
 `CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) NOT NULL PRIMARY KEY, reference VARCHAR(16) NOT NULL UNIQUE, token_hash CHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL, phone VARCHAR(20) NOT NULL, model VARCHAR(120) NOT NULL,
  service VARCHAR(20) NOT NULL, vehicle VARCHAR(20) NOT NULL, day CHAR(10) NOT NULL,
  hour INT NOT NULL, duration INT NOT NULL, total INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', created_at VARCHAR(32) NOT NULL
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
 `CREATE TABLE IF NOT EXISTS reservations (
  day CHAR(10) NOT NULL, hour INT NOT NULL, booking_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (day, hour), INDEX reservations_booking (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

// Reuse one pool and one schema check per server process (and across dev reloads).
const store = globalThis as typeof globalThis & { lamaaPool?: Pool; lamaaReady?: Promise<void> };

export async function database() {
 if (!process.env.DB_NAME || !process.env.DB_USER) throw new Error("Database not configured");
 store.lamaaPool ??= mysql.createPool({
  host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  charset: "utf8mb4", connectionLimit: 5,
 });
 const pool = store.lamaaPool;
 store.lamaaReady ??= (async () => { for (const sql of schema) await pool.query(sql); })()
  .catch(error => { store.lamaaReady = undefined; throw error; });
 await store.lamaaReady;
 return pool;
}
export async function first<T>(db: Pool | PoolConnection, sql: string, params: unknown[]) {
 const [rows] = await db.execute(sql, params as never[]);
 return (rows as T[])[0] ?? null;
}
export async function transaction(db: Pool, run: (connection: PoolConnection) => Promise<void>) {
 const connection = await db.getConnection();
 try {
  await connection.beginTransaction();
  await run(connection);
  await connection.commit();
 } catch (error) {
  await connection.rollback();
  throw error;
 } finally { connection.release(); }
}
export function json(data: unknown, status = 200) {
 return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function tokenHash(token: string) {
 const data = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
 return [...new Uint8Array(data)].map(n => n.toString(16).padStart(2, "0")).join("");
}
export async function readBody(request: Request) {
 const origin = request.headers.get("origin");
 // Compare hosts only: behind Hostinger's proxy the app itself may see plain http.
 const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
 if (origin && new URL(origin).host !== host) throw new Error("origin");
 if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("format");
 const text = await request.text();
 if (text.length > 5000) throw new Error("size");
 return JSON.parse(text);
}
export const bookingFields = "reference, name, model, service, vehicle, day, hour, duration, total, status";

import { env } from "cloudflare:workers";
export function database() { if (!env.DB) throw new Error("Database not configured"); return env.DB; }
export function json(data: unknown, status = 200) {
 return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export async function tokenHash(token: string) {
 const data = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
 return [...new Uint8Array(data)].map(n => n.toString(16).padStart(2, "0")).join("");
}
export async function readBody(request: Request) {
 const origin = request.headers.get("origin");
 if (origin && origin !== new URL(request.url).origin) throw new Error("origin");
 if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("format");
 const text = await request.text();
 if (text.length > 5000) throw new Error("size");
 return JSON.parse(text);
}
export const bookingFields = "reference, name, model, service, vehicle, day, hour, duration, total, status";

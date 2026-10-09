import { z } from "zod";
import { bookingFields, database, json, readBody, tokenHash } from "@/lib/server";
const schema = z.object({ reference: z.string().regex(/^LM-[A-F0-9]{8}$/), token: z.string().regex(/^[a-f0-9]{64}$/), action: z.enum(["view", "cancel"]).default("view") });
export async function POST(request: Request) {
 let data;
 try { data = schema.parse(await readBody(request)); }
 catch { return json({ error: "بيانات الوصول إلى الحجز غير صحيحة." }, 400); }
 try {
  const db = database(); const hash = await tokenHash(data.token);
  const row = await db.prepare("SELECT id FROM bookings WHERE reference = ? AND token_hash = ?").bind(data.reference, hash).first<{ id: string }>();
  if (!row) return json({ error: "لم نعثر على حجز بهذه البيانات." }, 404);
  if (data.action === "cancel") await db.batch([
   db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(row.id),
   db.prepare("DELETE FROM reservations WHERE booking_id = ?").bind(row.id),
  ]);
  return json({ booking: await db.prepare("SELECT " + bookingFields + " FROM bookings WHERE id = ?").bind(row.id).first() });
 } catch { return json({ error: "تعذّر الوصول إلى الحجز. حاول مرة أخرى." }, 503); }
}

import { z } from "zod";
import { bookingFields, database, first, json, readBody, tokenHash, transaction } from "@/lib/server";
const schema = z.object({ reference: z.string().regex(/^LM-[A-F0-9]{8}$/), token: z.string().regex(/^[a-f0-9]{64}$/), action: z.enum(["view", "cancel"]).default("view") });
export async function POST(request: Request) {
 let data;
 try { data = schema.parse(await readBody(request)); }
 catch { return json({ error: "بيانات الوصول إلى الحجز غير صحيحة." }, 400); }
 try {
  const db = await database(); const hash = await tokenHash(data.token);
  const row = await first<{ id: string }>(db, "SELECT id FROM bookings WHERE reference = ? AND token_hash = ?", [data.reference, hash]);
  if (!row) return json({ error: "لم نعثر على حجز بهذه البيانات." }, 404);
  if (data.action === "cancel") await transaction(db, async tx => {
   await tx.execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [row.id]);
   await tx.execute("DELETE FROM reservations WHERE booking_id = ?", [row.id]);
  });
  return json({ booking: await first(db, "SELECT " + bookingFields + " FROM bookings WHERE id = ?", [row.id]) });
 } catch { return json({ error: "تعذّر الوصول إلى الحجز. حاول مرة أخرى." }, 503); }
}

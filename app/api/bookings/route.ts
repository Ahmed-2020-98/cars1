import { z } from "zod";
import { services, vehicles, validDay, futureSlot } from "@/lib/catalog";
import { bookingFields, database, first, json, readBody, tokenHash, transaction } from "@/lib/server";
const schema = z.object({
 id: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/),
 name: z.string().trim().min(2).max(80),
 phone: z.string().transform(s => s.replace(/[\s()-]/g, "")).refine(s => /^(05\d{8}|\+9665\d{8}|009665\d{8})$/.test(s)),
 model: z.string().trim().min(2).max(80),
 service: z.enum(["refresh", "signature", "ceramic"]), vehicle: z.enum(["sedan", "suv", "large"]),
 day: z.string().refine(validDay), hour: z.number().int().min(10).max(20),
});
export async function POST(request: Request) {
 let input;
 try { input = schema.safeParse(await readBody(request)); }
 catch { return json({ error: "تعذّر قراءة الطلب. أعد المحاولة." }, 400); }
 if (!input.success) return json({ error: "راجع الاسم ورقم الجوال وبيانات السيارة والموعد." }, 400);
 const data = input.data;
 const service = services.find(s => s.id === data.service)!;
 const vehicle = vehicles.find(v => v.id === data.vehicle)!;
 try {
  const db = await database(); const hash = await tokenHash(data.token);
  const existing = await first<{ token_hash: string; [key: string]: unknown }>(db, "SELECT " + bookingFields + ", token_hash FROM bookings WHERE id = ?", [data.id]);
  if (existing) {
   if (existing.token_hash !== hash) return json({ error: "تعذّر حفظ هذا الطلب. ابدأ حجزًا جديدًا." }, 409);
   const { token_hash: _, ...booking } = existing; return json({ booking });
  }
  if (data.hour + service.hours > 22 || !futureSlot(data.day, data.hour)) return json({ error: "هذا الموعد لم يعد متاحًا. اختر موعدًا آخر." }, 409);
  const reference = "LM-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  const total = service.price + vehicle.extra;
  await transaction(db, async tx => {
   await tx.execute("INSERT INTO bookings (id, reference, token_hash, name, phone, model, service, vehicle, day, hour, duration, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
    [data.id, reference, hash, data.name, data.phone, data.model, data.service, data.vehicle, data.day, data.hour, service.hours, total, new Date().toISOString()]);
   for (let i = 0; i < service.hours; i++) await tx.execute("INSERT INTO reservations (day, hour, booking_id) VALUES (?, ?, ?)", [data.day, data.hour + i, data.id]);
  });
  return json({ booking: await first(db, "SELECT " + bookingFields + " FROM bookings WHERE id = ?", [data.id]) }, 201);
 } catch (error) {
  if ((error as { code?: string }).code === "ER_DUP_ENTRY") return json({ error: "تم حجز هذا الموعد للتو. اختر وقتًا آخر." }, 409);
  return json({ error: "لم نتمكن من حفظ الطلب. بياناتك ما زالت موجودة؛ حاول مرة أخرى." }, 503);
 }
}

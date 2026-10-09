import { services, validDay, futureSlot } from "@/lib/catalog";
import { database, json } from "@/lib/server";
export async function GET(request: Request) {
 const params = new URL(request.url).searchParams;
 const day = params.get("date") || "";
 const service = services.find(s => s.id === params.get("service"));
 if (!service || !validDay(day)) return json({ error: "اختر خدمة وتاريخًا خلال الستين يومًا القادمة." }, 400);
 try {
  const [occupied] = await (await database()).execute("SELECT hour FROM reservations WHERE day = ?", [day]);
  const used = new Set((occupied as { hour: number }[]).map(r => r.hour));
  const slots = Array.from({ length: 13 - service.hours }, (_, i) => 10 + i).map(hour => ({
   hour, available: futureSlot(day, hour) && Array.from({ length: service.hours }, (_, i) => hour + i).every(h => !used.has(h)),
  }));
  return json({ slots });
 } catch { return json({ error: "تعذّر تحميل المواعيد. حاول مرة أخرى." }, 503); }
}

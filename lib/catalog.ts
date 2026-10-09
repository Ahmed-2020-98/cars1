export const services = [
 { id: "refresh", name: "انتعاش يومي", subtitle: "نظافة من الداخل. تألّق من الخارج.", price: 180, hours: 2, duration: "ساعتان", features: ["غسيل خارجي يدوي", "تنظيف المقصورة والمقاعد", "تنظيف الجنوط وتلميع الإطارات", "تنظيف الزجاج من الداخل والخارج"] },
 { id: "signature", name: "لمعة متكاملة", subtitle: "عناية أعمق، وتفاصيل تصنع الفرق.", price: 450, hours: 3, duration: "٣ ساعات", features: ["كل خدمات باقة انتعاش يومي", "تلميع خارجي بمرحلة واحدة", "تنظيف داخلي عميق", "طبقة شمع لحماية اللمعان"] },
 { id: "ceramic", name: "حماية سيراميك", subtitle: "لمعان يدوم. وحماية تليق بسيارتك.", price: 950, hours: 5, duration: "٥ ساعات", features: ["تنظيف وتحضير سطح الطلاء", "تلميع وتصحيح خفيف للطلاء", "تطبيق طبقة حماية سيراميك", "إرشادات العناية بعد التطبيق"] },
] as const;
export const vehicles = [
 { id: "sedan", name: "سيدان", note: "سيارة صغيرة أو متوسطة", extra: 0 },
 { id: "suv", name: "دفع رباعي", note: "كروس أوفر أو SUV", extra: 80 },
 { id: "large", name: "سيارة كبيرة", note: "عائلية كبيرة أو بيك أب", extra: 120 },
] as const;
export type ServiceId = typeof services[number]["id"];
export type VehicleId = typeof vehicles[number]["id"];
export const money = (amount: number) => new Intl.NumberFormat("en-US").format(amount);
export function dateKey(offset = 0) {
 return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 86400000));
}
export function dateLabel(day: string, short = false) {
 return new Intl.DateTimeFormat("ar-SA", { calendar: "gregory", weekday: short ? "short" : "long", day: "numeric", month: short ? "short" : "long", timeZone: "Asia/Riyadh" }).format(new Date(day + "T12:00:00+03:00"));
}
export function timeLabel(hour: number) { return (hour > 12 ? hour - 12 : hour) + ":00 " + (hour < 12 ? "ص" : "م"); }
export function validDay(day: string) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < dateKey() || day > dateKey(60)) return false;
 const parsed = new Date(day + "T12:00:00Z");
 return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}
export function futureSlot(day: string, hour: number) {
 return new Date(day + "T" + String(hour).padStart(2, "0") + ":00:00+03:00").getTime() > Date.now() + 3600000;
}

import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const bookings = sqliteTable("bookings", {
 id: text("id").primaryKey(), reference: text("reference").notNull().unique(), tokenHash: text("token_hash").notNull(),
 name: text("name").notNull(), phone: text("phone").notNull(), model: text("model").notNull(),
 service: text("service").notNull(), vehicle: text("vehicle").notNull(), day: text("day").notNull(),
 hour: integer("hour").notNull(), duration: integer("duration").notNull(), total: integer("total").notNull(),
 status: text("status").notNull().default("pending"), createdAt: text("created_at").notNull(),
});
export const reservations = sqliteTable("reservations", {
 day: text("day").notNull(), hour: integer("hour").notNull(),
 bookingId: text("booking_id").notNull().references(() => bookings.id),
}, table => [primaryKey({ columns: [table.day, table.hour] })]);

import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const composersTable = pgTable("composers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  born: text("born"),
  died: text("died"),
  nationality: text("nationality"),
  imageUrl: text("image_url"),
  biography: text("biography"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertComposerSchema = createInsertSchema(composersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComposer = z.infer<typeof insertComposerSchema>;
export type Composer = typeof composersTable.$inferSelect;

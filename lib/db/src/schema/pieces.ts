import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const piecesTable = pgTable("pieces", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  composer: text("composer").notNull(),
  composerId: integer("composer_id"),
  year: text("year"),
  genre: text("genre"),
  youtubeUrl: text("youtube_url"),
  imageUrl: text("image_url"),
  content: text("content"),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPieceSchema = createInsertSchema(piecesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPiece = z.infer<typeof insertPieceSchema>;
export type Piece = typeof piecesTable.$inferSelect;

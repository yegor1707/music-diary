import { Router, type IRouter } from "express";
import { db, notesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notes", async (_req, res) => {
  const notes = await db.select().from(notesTable).orderBy(notesTable.sortOrder, notesTable.createdAt);
  res.json(notes.map(formatNote));
});

router.post("/notes", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [note] = await db.insert(notesTable).values({
    title: String(body.title ?? ""),
    section: String(body.section ?? "notes"),
    chapterTitle: body.chapterTitle != null ? String(body.chapterTitle) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    content: body.content != null ? String(body.content) : null,
    sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
  }).returning();
  res.status(201).json(formatNote(note));
});

router.get("/notes/:id", async (req, res) => {
  const [note] = await db.select().from(notesTable).where(eq(notesTable.id, Number(req.params.id)));
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatNote(note));
});

router.put("/notes/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [note] = await db.update(notesTable).set({
    title: String(body.title ?? ""),
    section: String(body.section ?? "notes"),
    chapterTitle: body.chapterTitle != null ? String(body.chapterTitle) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    content: body.content != null ? String(body.content) : null,
    sortOrder: body.sortOrder != null ? Number(body.sortOrder) : 0,
    updatedAt: new Date(),
  }).where(eq(notesTable.id, Number(req.params.id))).returning();
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatNote(note));
});

router.delete("/notes/:id", async (req, res) => {
  await db.delete(notesTable).where(eq(notesTable.id, Number(req.params.id)));
  res.status(204).send();
});

function formatNote(n: typeof notesTable.$inferSelect) {
  return {
    id: n.id,
    title: n.title,
    section: n.section,
    chapterTitle: n.chapterTitle ?? null,
    imageUrl: n.imageUrl ?? null,
    content: n.content ?? null,
    sortOrder: n.sortOrder,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export default router;

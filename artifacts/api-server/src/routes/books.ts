import { Router, type IRouter } from "express";
import { db, booksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/books", async (_req, res) => {
  const books = await db.select().from(booksTable).orderBy(booksTable.createdAt);
  res.json(books.map(formatBook));
});

router.post("/books", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [book] = await db.insert(booksTable).values({
    title: String(body.title ?? ""),
    author: body.author != null ? String(body.author) : null,
    coverUrl: body.coverUrl != null ? String(body.coverUrl) : null,
    synopsis: body.synopsis != null ? String(body.synopsis) : null,
    year: body.year != null ? String(body.year) : null,
    content: body.content != null ? String(body.content) : null,
  }).returning();
  res.status(201).json(formatBook(book));
});

router.get("/books/:id", async (req, res) => {
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, Number(req.params.id)));
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatBook(book));
});

router.put("/books/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [book] = await db.update(booksTable).set({
    title: String(body.title ?? ""),
    author: body.author != null ? String(body.author) : null,
    coverUrl: body.coverUrl != null ? String(body.coverUrl) : null,
    synopsis: body.synopsis != null ? String(body.synopsis) : null,
    year: body.year != null ? String(body.year) : null,
    content: body.content != null ? String(body.content) : null,
    updatedAt: new Date(),
  }).where(eq(booksTable.id, Number(req.params.id))).returning();
  if (!book) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatBook(book));
});

router.delete("/books/:id", async (req, res) => {
  await db.delete(booksTable).where(eq(booksTable.id, Number(req.params.id)));
  res.status(204).send();
});

function formatBook(b: typeof booksTable.$inferSelect) {
  return {
    id: b.id,
    title: b.title,
    author: b.author ?? null,
    coverUrl: b.coverUrl ?? null,
    synopsis: b.synopsis ?? null,
    year: b.year ?? null,
    content: b.content ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

export default router;

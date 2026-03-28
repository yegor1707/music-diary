import { Router, type IRouter } from "express";
import { db, piecesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/pieces", async (req, res) => {
  const pieces = await db.select().from(piecesTable).orderBy(piecesTable.createdAt);
  res.json(pieces.map(formatPiece));
});

router.post("/pieces", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [piece] = await db.insert(piecesTable).values({
    title: String(body.title ?? ""),
    composer: String(body.composer ?? ""),
    composerId: body.composerId != null ? Number(body.composerId) : null,
    year: body.year != null ? String(body.year) : null,
    genre: body.genre != null ? String(body.genre) : null,
    youtubeUrl: body.youtubeUrl != null ? String(body.youtubeUrl) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    content: body.content != null ? String(body.content) : null,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
  }).returning();
  res.status(201).json(formatPiece(piece));
});

router.get("/pieces/:id", async (req, res) => {
  const [piece] = await db.select().from(piecesTable).where(eq(piecesTable.id, Number(req.params.id)));
  if (!piece) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatPiece(piece));
});

router.put("/pieces/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [piece] = await db.update(piecesTable).set({
    title: String(body.title ?? ""),
    composer: String(body.composer ?? ""),
    composerId: body.composerId != null ? Number(body.composerId) : null,
    year: body.year != null ? String(body.year) : null,
    genre: body.genre != null ? String(body.genre) : null,
    youtubeUrl: body.youtubeUrl != null ? String(body.youtubeUrl) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    content: body.content != null ? String(body.content) : null,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    updatedAt: new Date(),
  }).where(eq(piecesTable.id, Number(req.params.id))).returning();
  if (!piece) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatPiece(piece));
});

router.delete("/pieces/:id", async (req, res) => {
  await db.delete(piecesTable).where(eq(piecesTable.id, Number(req.params.id)));
  res.status(204).send();
});

function formatPiece(p: typeof piecesTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    composer: p.composer,
    composerId: p.composerId ?? null,
    year: p.year ?? null,
    genre: p.genre ?? null,
    youtubeUrl: p.youtubeUrl ?? null,
    imageUrl: p.imageUrl ?? null,
    content: p.content ?? null,
    tags: p.tags ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export default router;

import { Router, type IRouter } from "express";
import { db, composersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/composers", async (_req, res) => {
  const composers = await db.select().from(composersTable).orderBy(composersTable.name);
  res.json(composers.map(formatComposer));
});

router.post("/composers", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [composer] = await db.insert(composersTable).values({
    name: String(body.name ?? ""),
    born: body.born != null ? String(body.born) : null,
    died: body.died != null ? String(body.died) : null,
    nationality: body.nationality != null ? String(body.nationality) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    biography: body.biography != null ? String(body.biography) : null,
  }).returning();
  res.status(201).json(formatComposer(composer));
});

router.get("/composers/:id", async (req, res) => {
  const [composer] = await db.select().from(composersTable).where(eq(composersTable.id, Number(req.params.id)));
  if (!composer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatComposer(composer));
});

router.put("/composers/:id", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const [composer] = await db.update(composersTable).set({
    name: String(body.name ?? ""),
    born: body.born != null ? String(body.born) : null,
    died: body.died != null ? String(body.died) : null,
    nationality: body.nationality != null ? String(body.nationality) : null,
    imageUrl: body.imageUrl != null ? String(body.imageUrl) : null,
    biography: body.biography != null ? String(body.biography) : null,
    updatedAt: new Date(),
  }).where(eq(composersTable.id, Number(req.params.id))).returning();
  if (!composer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatComposer(composer));
});

router.delete("/composers/:id", async (req, res) => {
  await db.delete(composersTable).where(eq(composersTable.id, Number(req.params.id)));
  res.status(204).send();
});

function formatComposer(c: typeof composersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    born: c.born ?? null,
    died: c.died ?? null,
    nationality: c.nationality ?? null,
    imageUrl: c.imageUrl ?? null,
    biography: c.biography ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export default router;

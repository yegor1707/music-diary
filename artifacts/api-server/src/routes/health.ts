import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db, composersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    await db.select({ count: sql<number>`count(*)` }).from(composersTable);
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json({ ...data, db: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({
      status: "error",
      db: "unreachable",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

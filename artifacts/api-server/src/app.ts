import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const possiblePaths = [
  path.resolve(process.cwd(), "artifacts/music-notebook/dist/public"),
  path.resolve(process.cwd(), "../music-notebook/dist/public"),
  path.resolve(__dirname, "../../music-notebook/dist/public"),
];

const frontendDist = possiblePaths.find((p) => fs.existsSync(p));

if (frontendDist) {
  logger.info({ frontendDist }, "Serving frontend static files");
  app.use(express.static(frontendDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  logger.warn({ tried: possiblePaths }, "Frontend dist not found, running in API-only mode");
  app.get("/", (_req, res) => {
    res.json({ name: "Music Diary API", status: "ok", version: "1.0.0" });
  });
}

export default app;

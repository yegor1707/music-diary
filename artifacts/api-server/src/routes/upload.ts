import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "../lib/logger.js";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs allowed"));
    }
  },
});

const objectStorageService = new ObjectStorageService();

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": req.file.mimetype },
      body: fileBuffer,
    });

    fs.unlinkSync(req.file.path);

    const serveUrl = `/api/storage${objectPath}`;
    logger.info({ objectPath, serveUrl }, "File uploaded to object storage");
    res.json({ url: serveUrl });
  } catch (err) {
    logger.error({ err }, "GCS upload failed, falling back to local");
    const localUrl = `/api/uploads/${req.file.filename}`;
    res.json({ url: localUrl });
  }
});

router.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(filePath);
});

export default router;

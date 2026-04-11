import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger.js";

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

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const ext = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);

      fs.unlinkSync(req.file.path);

      logger.info({ fileName, url: data.publicUrl }, "File uploaded to Supabase Storage");
      res.json({ url: data.publicUrl });
      return;
    } catch (err) {
      logger.error({ err }, "Supabase upload failed, falling back to local");
    }
  }

  const localUrl = `/api/uploads/${req.file.filename}`;
  res.json({ url: localUrl });
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

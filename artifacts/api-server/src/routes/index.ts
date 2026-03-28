import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import piecesRouter from "./pieces.js";
import composersRouter from "./composers.js";
import notesRouter from "./notes.js";
import booksRouter from "./books.js";
import uploadRouter from "./upload.js";
import storageRouter from "./storage.js";
import inspirationRouter from "./inspiration.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(piecesRouter);
router.use(composersRouter);
router.use(notesRouter);
router.use(booksRouter);
router.use(uploadRouter);
router.use(storageRouter);
router.use(inspirationRouter);

export default router;

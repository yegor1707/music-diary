import { Router, type IRouter } from "express";

const router: IRouter = Router();

const EDIT_PASSWORD = "1707";

router.post("/auth/verify", (req, res) => {
  const { password } = req.body as { password?: string };
  res.json({ success: password === EDIT_PASSWORD });
});

export default router;

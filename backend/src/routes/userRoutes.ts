import express from "express";
import { downloadFile, getDashboard } from "../controllers/userController";
import auth from "../middleware/auth";
import requireRole from "../middleware/requireRole";

const router = express.Router();

router.use(auth);
router.get("/dashboard", requireRole("USER", "ADMIN"), getDashboard);
router.get("/files/:fileId/download", requireRole("USER", "ADMIN"), downloadFile);

export default router;

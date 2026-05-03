import express from "express";
import multer from "multer";
import {
  addMember,
  assignFilePermission,
  assignFolderPermission,
  createFolder,
  createGroup,
  createUser,
  deleteFile,
  deleteFolder,
  listFiles,
  listFolders,
  listGroups,
  listUsers,
  revokeFilePermission,
  revokeFolderPermission,
  uploadFile,
} from "../controllers/adminController";
import auth from "../middleware/auth";
import requireRole from "../middleware/requireRole";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth, requireRole("ADMIN"));

router.get("/users", listUsers);
router.post("/users", createUser);

router.get("/groups", listGroups);
router.post("/groups", createGroup);
router.post("/groups/:groupId/members", addMember);

router.get("/folders", listFolders);
router.post("/folders", createFolder);
router.post("/folders/:folderId/permissions", assignFolderPermission);
router.delete("/folders/:folderId/permissions/:permissionId", revokeFolderPermission);
router.delete("/folders/:folderId", deleteFolder);

router.get("/files", listFiles);
router.post("/files/upload", upload.single("file"), uploadFile);
router.post("/files/:fileId/permissions", assignFilePermission);
router.delete("/files/:fileId/permissions/:permissionId", revokeFilePermission);
router.delete("/files/:fileId", deleteFile);

export default router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = __importDefault(require("../middleware/auth"));
const requireRole_1 = __importDefault(require("../middleware/requireRole"));
const router = express_1.default.Router();
router.use(auth_1.default);
router.get("/dashboard", (0, requireRole_1.default)("USER", "ADMIN"), userController_1.getDashboard);
router.get("/files/:fileId/download", (0, requireRole_1.default)("USER", "ADMIN"), userController_1.downloadFile);
exports.default = router;

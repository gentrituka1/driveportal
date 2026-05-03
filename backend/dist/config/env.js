"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const storageDriver = (process.env.STORAGE_DRIVER || "local");
const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 4000),
    jwtSecret: process.env.JWT_SECRET || "change-this-secret",
    allowSelfRegistration: process.env.ALLOW_SELF_REGISTRATION === "true",
    storageDriver,
    localUploadDir: process.env.LOCAL_UPLOAD_DIR || "uploads",
    s3Region: process.env.S3_REGION || "",
    s3Bucket: process.env.S3_BUCKET || "",
};
exports.default = env;

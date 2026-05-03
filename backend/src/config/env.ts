import dotenv from "dotenv";

dotenv.config();

type StorageDriver = "local" | "s3";

const storageDriver = (process.env.STORAGE_DRIVER || "local") as StorageDriver;

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

export default env;

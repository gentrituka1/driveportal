"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBuffer = uploadBuffer;
exports.getLocalFileBuffer = getLocalFileBuffer;
exports.createS3DownloadUrl = createS3DownloadUrl;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = __importDefault(require("../config/env"));
const localRoot = node_path_1.default.resolve(process.cwd(), env_1.default.localUploadDir);
if (!node_fs_1.default.existsSync(localRoot)) {
    node_fs_1.default.mkdirSync(localRoot, { recursive: true });
}
const s3Client = env_1.default.storageDriver === "s3" && env_1.default.s3Region ? new client_s3_1.S3Client({ region: env_1.default.s3Region }) : null;
async function uploadBuffer(fileBuffer, extension) {
    const key = `${Date.now()}-${(0, node_crypto_1.randomUUID)()}${extension ? `.${extension}` : ""}`;
    if (env_1.default.storageDriver === "s3") {
        if (!s3Client || !env_1.default.s3Bucket) {
            throw new Error("S3 storage selected but S3 config is incomplete.");
        }
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: env_1.default.s3Bucket,
            Key: key,
            Body: fileBuffer,
        }));
        return { key, provider: "s3" };
    }
    const destination = node_path_1.default.join(localRoot, key);
    await node_fs_1.default.promises.writeFile(destination, fileBuffer);
    return { key, provider: "local", localPath: destination };
}
async function getLocalFileBuffer(key) {
    return node_fs_1.default.promises.readFile(node_path_1.default.join(localRoot, key));
}
async function createS3DownloadUrl(key, fileName) {
    if (!s3Client || !env_1.default.s3Bucket) {
        throw new Error("S3 storage selected but S3 config is incomplete.");
    }
    return (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
        Bucket: env_1.default.s3Bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${String(fileName || key).replace(/"/g, "")}"`,
    }), { expiresIn: 300 });
}

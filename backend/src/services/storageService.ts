import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "../config/env";

const localRoot = path.resolve(process.cwd(), env.localUploadDir);
if (!fs.existsSync(localRoot)) {
  fs.mkdirSync(localRoot, { recursive: true });
}

const s3Client = env.storageDriver === "s3" && env.s3Region ? new S3Client({ region: env.s3Region }) : null;

export async function uploadBuffer(fileBuffer: Buffer, extension: string) {
  const key = `${Date.now()}-${randomUUID()}${extension ? `.${extension}` : ""}`;

  if (env.storageDriver === "s3") {
    if (!s3Client || !env.s3Bucket) {
      throw new Error("S3 storage selected but S3 config is incomplete.");
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
        Body: fileBuffer,
      })
    );

    return { key, provider: "s3" as const };
  }

  const destination = path.join(localRoot, key);
  await fs.promises.writeFile(destination, fileBuffer);
  return { key, provider: "local" as const, localPath: destination };
}

export async function getLocalFileBuffer(key: string) {
  return fs.promises.readFile(path.join(localRoot, key));
}

export async function createS3DownloadUrl(key: string, fileName?: string) {
  if (!s3Client || !env.s3Bucket) {
    throw new Error("S3 storage selected but S3 config is incomplete.");
  }

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: env.s3Bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${String(fileName || key).replace(/"/g, "")}"`,
    }),
    { expiresIn: 300 }
  );
}

import path from "node:path";
import type { Request, Response } from "express";
import env from "../config/env";
import { prisma } from "../lib/prisma";
import { getAccessibleFiles, getAccessibleFolders, hasFileAccess } from "../services/accessService";
import { createS3DownloadUrl, getLocalFileBuffer } from "../services/storageService";

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function getDashboard(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const folders = await getAccessibleFolders(req.user.id);
  const files = (await getAccessibleFiles(req.user.id)).map((file) => ({
    id: file.id,
    folderId: file.folderId,
    originalName: file.originalName,
    extension: file.extension,
    size: file.size,
    createdAt: file.createdAt,
  }));

  return res.json({ folders, files });
}

export async function downloadFile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const fileId = getParamValue(req.params.fileId);
  if (!fileId) {
    return res.status(400).json({ message: "fileId is required." });
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });
  if (!file) {
    return res.status(404).json({ message: "File not found." });
  }

  if (!(await hasFileAccess(file.id, req.user.id))) {
    return res.status(403).json({ message: "Forbidden." });
  }

  if (env.storageDriver === "s3") {
    const signedUrl = await createS3DownloadUrl(file.storageKey, file.originalName);
    return res.json({ downloadUrl: signedUrl, fileName: file.originalName });
  }

  const buffer = await getLocalFileBuffer(file.storageKey);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${path.basename(file.originalName).replace(/"/g, "")}"`
  );
  return res.send(buffer);
}

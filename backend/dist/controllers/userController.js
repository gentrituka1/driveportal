"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
exports.downloadFile = downloadFile;
const node_path_1 = __importDefault(require("node:path"));
const env_1 = __importDefault(require("../config/env"));
const prisma_1 = require("../lib/prisma");
const accessService_1 = require("../services/accessService");
const storageService_1 = require("../services/storageService");
function getParamValue(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
async function getDashboard(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const folders = await (0, accessService_1.getAccessibleFolders)(req.user.id);
    const files = (await (0, accessService_1.getAccessibleFiles)(req.user.id)).map((file) => ({
        id: file.id,
        folderId: file.folderId,
        originalName: file.originalName,
        extension: file.extension,
        size: file.size,
        createdAt: file.createdAt,
    }));
    return res.json({ folders, files });
}
async function downloadFile(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const fileId = getParamValue(req.params.fileId);
    if (!fileId) {
        return res.status(400).json({ message: "fileId is required." });
    }
    const file = await prisma_1.prisma.file.findUnique({
        where: { id: fileId },
    });
    if (!file) {
        return res.status(404).json({ message: "File not found." });
    }
    if (!(await (0, accessService_1.hasFileAccess)(file.id, req.user.id))) {
        return res.status(403).json({ message: "Forbidden." });
    }
    if (env_1.default.storageDriver === "s3") {
        const signedUrl = await (0, storageService_1.createS3DownloadUrl)(file.storageKey, file.originalName);
        return res.json({ downloadUrl: signedUrl, fileName: file.originalName });
    }
    const buffer = await (0, storageService_1.getLocalFileBuffer)(file.storageKey);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${node_path_1.default.basename(file.originalName).replace(/"/g, "")}"`);
    return res.send(buffer);
}

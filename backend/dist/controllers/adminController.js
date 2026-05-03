"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.listUsers = listUsers;
exports.createGroup = createGroup;
exports.listGroups = listGroups;
exports.addMember = addMember;
exports.createFolder = createFolder;
exports.listFolders = listFolders;
exports.listFiles = listFiles;
exports.uploadFile = uploadFile;
exports.assignFolderPermission = assignFolderPermission;
exports.assignFilePermission = assignFilePermission;
exports.revokeFolderPermission = revokeFolderPermission;
exports.revokeFilePermission = revokeFilePermission;
exports.deleteFile = deleteFile;
exports.deleteFolder = deleteFolder;
const node_path_1 = __importDefault(require("node:path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const storageService_1 = require("../services/storageService");
const createUserSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(["ADMIN", "USER"]).default("USER"),
});
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
});
const addMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
});
const createFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
const uploadFileSchema = zod_1.z.object({
    folderId: zod_1.z.string().min(1),
});
const permissionSchema = zod_1.z
    .object({
    userId: zod_1.z.string().optional(),
    groupId: zod_1.z.string().optional(),
})
    .refine((data) => Boolean(data.userId) !== Boolean(data.groupId), {
    message: "Provide exactly one of userId or groupId.",
});
function getParamValue(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
async function createUser(req, res) {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const { email, password, role } = parsed.data;
    const existingUser = await prisma_1.prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existingUser) {
        return res.status(409).json({ message: "Email already exists." });
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            passwordHash: await bcryptjs_1.default.hash(password, 10),
            role,
        },
    });
    return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
}
async function listUsers(_req, res) {
    const users = await prisma_1.prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
    });
    return res.json({
        users,
    });
}
async function createGroup(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const group = await prisma_1.prisma.group.create({
        data: {
            name: parsed.data.name,
            createdById: req.user.id,
        },
    });
    return res.status(201).json({
        group: {
            id: group.id,
            name: group.name,
            createdBy: group.createdById,
            createdAt: group.createdAt,
        },
    });
}
async function listGroups(_req, res) {
    const groupsWithMembers = await prisma_1.prisma.group.findMany({
        include: {
            members: {
                select: {
                    userId: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    const groups = groupsWithMembers.map((group) => ({
        id: group.id,
        name: group.name,
        createdBy: group.createdById,
        createdAt: group.createdAt,
        members: group.members.map((member) => member.userId),
    }));
    return res.json({ groups });
}
async function addMember(req, res) {
    const groupId = getParamValue(req.params.groupId);
    if (!groupId) {
        return res.status(400).json({ message: "groupId is required." });
    }
    const parsed = addMemberSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const group = await prisma_1.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }
    const existingMembership = await prisma_1.prisma.groupMembership.findUnique({
        where: {
            groupId_userId: {
                groupId: group.id,
                userId: user.id,
            },
        },
    });
    if (!existingMembership) {
        await prisma_1.prisma.groupMembership.create({
            data: {
                groupId: group.id,
                userId: user.id,
            },
        });
    }
    return res.json({ message: "Member added.", groupId: group.id, userId: user.id });
}
async function createFolder(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    const folder = await prisma_1.prisma.folder.create({
        data: {
            name: parsed.data.name,
            createdById: req.user.id,
        },
    });
    return res.status(201).json({
        folder: {
            id: folder.id,
            name: folder.name,
            createdBy: folder.createdById,
            createdAt: folder.createdAt,
        },
    });
}
async function listFolders(_req, res) {
    const folderRows = await prisma_1.prisma.folder.findMany({
        orderBy: { createdAt: "desc" },
    });
    const folders = folderRows.map((folder) => ({
        id: folder.id,
        name: folder.name,
        createdBy: folder.createdById,
        createdAt: folder.createdAt,
    }));
    return res.json({ folders });
}
async function listFiles(_req, res) {
    const fileRows = await prisma_1.prisma.file.findMany({
        orderBy: { createdAt: "desc" },
    });
    const files = fileRows.map((file) => ({
        id: file.id,
        folderId: file.folderId,
        storageKey: file.storageKey,
        storageProvider: file.storageProvider,
        originalName: file.originalName,
        extension: file.extension,
        mimeType: file.mimeType,
        size: file.size,
        uploadedBy: file.uploadedById,
        createdAt: file.createdAt,
    }));
    return res.json({ files });
}
async function uploadFile(req, res) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized." });
    }
    const parsedBody = uploadFileSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsedBody.error.issues });
    }
    const folder = await prisma_1.prisma.folder.findUnique({ where: { id: parsedBody.data.folderId } });
    if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
    }
    const fileUpload = req.file;
    if (!fileUpload) {
        return res.status(400).json({ message: "File is required." });
    }
    const extension = node_path_1.default.extname(fileUpload.originalname).replace(".", "");
    const storage = await (0, storageService_1.uploadBuffer)(fileUpload.buffer, extension);
    const file = await prisma_1.prisma.file.create({
        data: {
            folderId: folder.id,
            storageKey: storage.key,
            storageProvider: storage.provider,
            originalName: fileUpload.originalname,
            extension,
            mimeType: fileUpload.mimetype || "application/octet-stream",
            size: fileUpload.size,
            uploadedById: req.user.id,
        },
    });
    return res.status(201).json({
        file: {
            id: file.id,
            folderId: file.folderId,
            storageKey: file.storageKey,
            storageProvider: file.storageProvider,
            originalName: file.originalName,
            extension: file.extension,
            mimeType: file.mimeType,
            size: file.size,
            uploadedBy: file.uploadedById,
            createdAt: file.createdAt,
        },
    });
}
async function assignFolderPermission(req, res) {
    const folderId = getParamValue(req.params.folderId);
    if (!folderId) {
        return res.status(400).json({ message: "folderId is required." });
    }
    const folder = await prisma_1.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
    }
    const parsed = permissionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    if (parsed.data.userId) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
    }
    if (parsed.data.groupId) {
        const group = await prisma_1.prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }
    }
    const existingPermission = await prisma_1.prisma.folderPermission.findFirst({
        where: {
            folderId: folder.id,
            userId: parsed.data.userId ?? null,
            groupId: parsed.data.groupId ?? null,
        },
        select: { id: true },
    });
    if (existingPermission) {
        return res.status(409).json({ message: "Permission already exists." });
    }
    const permission = await prisma_1.prisma.folderPermission.create({
        data: {
            folderId: folder.id,
            userId: parsed.data.userId,
            groupId: parsed.data.groupId,
        },
    });
    return res.status(201).json({ permission });
}
async function assignFilePermission(req, res) {
    const fileId = getParamValue(req.params.fileId);
    if (!fileId) {
        return res.status(400).json({ message: "fileId is required." });
    }
    const file = await prisma_1.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) {
        return res.status(404).json({ message: "File not found." });
    }
    const parsed = permissionSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
    }
    if (parsed.data.userId) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
    }
    if (parsed.data.groupId) {
        const group = await prisma_1.prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }
    }
    const existingPermission = await prisma_1.prisma.filePermission.findFirst({
        where: {
            fileId: file.id,
            userId: parsed.data.userId ?? null,
            groupId: parsed.data.groupId ?? null,
        },
        select: { id: true },
    });
    if (existingPermission) {
        return res.status(409).json({ message: "Permission already exists." });
    }
    const permission = await prisma_1.prisma.filePermission.create({
        data: {
            fileId: file.id,
            userId: parsed.data.userId,
            groupId: parsed.data.groupId,
        },
    });
    return res.status(201).json({ permission });
}
async function revokeFolderPermission(req, res) {
    const folderId = getParamValue(req.params.folderId);
    const permissionId = getParamValue(req.params.permissionId);
    if (!folderId || !permissionId) {
        return res.status(400).json({ message: "folderId and permissionId are required." });
    }
    const permission = await prisma_1.prisma.folderPermission.findFirst({
        where: { id: permissionId, folderId },
        select: { id: true },
    });
    if (!permission) {
        return res.status(404).json({ message: "Folder permission not found." });
    }
    await prisma_1.prisma.folderPermission.delete({ where: { id: permission.id } });
    return res.json({ message: "Folder permission revoked." });
}
async function revokeFilePermission(req, res) {
    const fileId = getParamValue(req.params.fileId);
    const permissionId = getParamValue(req.params.permissionId);
    if (!fileId || !permissionId) {
        return res.status(400).json({ message: "fileId and permissionId are required." });
    }
    const permission = await prisma_1.prisma.filePermission.findFirst({
        where: { id: permissionId, fileId },
        select: { id: true },
    });
    if (!permission) {
        return res.status(404).json({ message: "File permission not found." });
    }
    await prisma_1.prisma.filePermission.delete({ where: { id: permission.id } });
    return res.json({ message: "File permission revoked." });
}
async function deleteFile(req, res) {
    const fileId = getParamValue(req.params.fileId);
    if (!fileId) {
        return res.status(400).json({ message: "fileId is required." });
    }
    const file = await prisma_1.prisma.file.findUnique({ where: { id: fileId }, select: { id: true } });
    if (!file) {
        return res.status(404).json({ message: "File not found." });
    }
    await prisma_1.prisma.file.delete({ where: { id: fileId } });
    return res.json({ message: "File deleted." });
}
async function deleteFolder(req, res) {
    const folderId = getParamValue(req.params.folderId);
    if (!folderId) {
        return res.status(400).json({ message: "folderId is required." });
    }
    const folder = await prisma_1.prisma.folder.findUnique({ where: { id: folderId }, select: { id: true } });
    if (!folder) {
        return res.status(404).json({ message: "Folder not found." });
    }
    await prisma_1.prisma.folder.delete({ where: { id: folderId } });
    return res.json({ message: "Folder deleted." });
}

import path from "node:path";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { uploadBuffer } from "../services/storageService";
import { getParamValue } from "../utils/request";

const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

const createGroupSchema = z.object({
  name: z.string().min(2),
});

const addMemberSchema = z.object({
  userId: z.string().min(1),
});

const createFolderSchema = z.object({
  name: z.string().min(1),
});

const uploadFileSchema = z.object({
  folderId: z.string().min(1),
});

const permissionSchema = z
  .object({
    userId: z.string().optional(),
    groupId: z.string().optional(),
  })
  .refine((data) => Boolean(data.userId) !== Boolean(data.groupId), {
    message: "Provide exactly one of userId or groupId.",
  });

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  const { email, password, role } = parsed.data;
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
  });

  return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    users,
  });
}

export async function createGroup(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const parsed = createGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  const group = await prisma.group.create({
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

export async function listGroups(_req: Request, res: Response) {
  const groupsWithMembers = await prisma.group.findMany({
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

export async function addMember(req: Request, res: Response) {
  const groupId = getParamValue(req.params.groupId);
  if (!groupId) {
    return res.status(400).json({ message: "groupId is required." });
  }

  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return res.status(404).json({ message: "Group not found." });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const existingMembership = await prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
  });

  if (!existingMembership) {
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: user.id,
      },
    });
  }

  return res.json({ message: "Member added.", groupId: group.id, userId: user.id });
}

export async function createFolder(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const parsed = createFolderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  const folder = await prisma.folder.create({
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

export async function listFolders(_req: Request, res: Response) {
  const folderRows = await prisma.folder.findMany({
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

export async function listFiles(_req: Request, res: Response) {
  const fileRows = await prisma.file.findMany({
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

export async function uploadFile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const parsedBody = uploadFileSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsedBody.error.issues });
  }

  const folder = await prisma.folder.findUnique({ where: { id: parsedBody.data.folderId } });
  if (!folder) {
    return res.status(404).json({ message: "Folder not found." });
  }

  const fileUpload = req.file;
  if (!fileUpload) {
    return res.status(400).json({ message: "File is required." });
  }

  const extension = path.extname(fileUpload.originalname).replace(".", "");
  const storage = await uploadBuffer(fileUpload.buffer, extension);

  const file = await prisma.file.create({
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

export async function assignFolderPermission(req: Request, res: Response) {
  const folderId = getParamValue(req.params.folderId);
  if (!folderId) {
    return res.status(400).json({ message: "folderId is required." });
  }

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return res.status(404).json({ message: "Folder not found." });
  }

  const parsed = permissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  if (parsed.data.userId) {
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  }

  if (parsed.data.groupId) {
    const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }
  }

  const existingPermission = await prisma.folderPermission.findFirst({
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

  const permission = await prisma.folderPermission.create({
    data: {
      folderId: folder.id,
      userId: parsed.data.userId,
      groupId: parsed.data.groupId,
    },
  });

  return res.status(201).json({ permission });
}

export async function assignFilePermission(req: Request, res: Response) {
  const fileId = getParamValue(req.params.fileId);
  if (!fileId) {
    return res.status(400).json({ message: "fileId is required." });
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    return res.status(404).json({ message: "File not found." });
  }

  const parsed = permissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed.", issues: parsed.error.issues });
  }

  if (parsed.data.userId) {
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  }

  if (parsed.data.groupId) {
    const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId }, select: { id: true } });
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }
  }

  const existingPermission = await prisma.filePermission.findFirst({
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

  const permission = await prisma.filePermission.create({
    data: {
      fileId: file.id,
      userId: parsed.data.userId,
      groupId: parsed.data.groupId,
    },
  });

  return res.status(201).json({ permission });
}

export async function revokeFolderPermission(req: Request, res: Response) {
  const folderId = getParamValue(req.params.folderId);
  const permissionId = getParamValue(req.params.permissionId);
  if (!folderId || !permissionId) {
    return res.status(400).json({ message: "folderId and permissionId are required." });
  }

  const permission = await prisma.folderPermission.findFirst({
    where: { id: permissionId, folderId },
    select: { id: true },
  });
  if (!permission) {
    return res.status(404).json({ message: "Folder permission not found." });
  }

  await prisma.folderPermission.delete({ where: { id: permission.id } });
  return res.json({ message: "Folder permission revoked." });
}

export async function revokeFilePermission(req: Request, res: Response) {
  const fileId = getParamValue(req.params.fileId);
  const permissionId = getParamValue(req.params.permissionId);
  if (!fileId || !permissionId) {
    return res.status(400).json({ message: "fileId and permissionId are required." });
  }

  const permission = await prisma.filePermission.findFirst({
    where: { id: permissionId, fileId },
    select: { id: true },
  });
  if (!permission) {
    return res.status(404).json({ message: "File permission not found." });
  }

  await prisma.filePermission.delete({ where: { id: permission.id } });
  return res.json({ message: "File permission revoked." });
}

export async function deleteFile(req: Request, res: Response) {
  const fileId = getParamValue(req.params.fileId);
  if (!fileId) {
    return res.status(400).json({ message: "fileId is required." });
  }

  const file = await prisma.file.findUnique({ where: { id: fileId }, select: { id: true } });
  if (!file) {
    return res.status(404).json({ message: "File not found." });
  }

  await prisma.file.delete({ where: { id: fileId } });
  return res.json({ message: "File deleted." });
}

export async function deleteFolder(req: Request, res: Response) {
  const folderId = getParamValue(req.params.folderId);
  if (!folderId) {
    return res.status(400).json({ message: "folderId is required." });
  }

  const folder = await prisma.folder.findUnique({ where: { id: folderId }, select: { id: true } });
  if (!folder) {
    return res.status(404).json({ message: "Folder not found." });
  }

  await prisma.folder.delete({ where: { id: folderId } });

  return res.json({ message: "Folder deleted." });
}

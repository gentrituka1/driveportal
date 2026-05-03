"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupIdsForUser = getGroupIdsForUser;
exports.hasFolderAccess = hasFolderAccess;
exports.hasFileAccess = hasFileAccess;
exports.getAccessibleFolders = getAccessibleFolders;
exports.getAccessibleFiles = getAccessibleFiles;
const prisma_1 = require("../lib/prisma");
async function getGroupIdsForUser(userId) {
    const memberships = await prisma_1.prisma.groupMembership.findMany({
        where: { userId },
        select: { groupId: true },
    });
    return memberships.map((membership) => membership.groupId);
}
async function hasFolderAccess(folderId, userId) {
    const groupIds = await getGroupIdsForUser(userId);
    const permission = await prisma_1.prisma.folderPermission.findFirst({
        where: {
            folderId,
            OR: [{ userId }, { groupId: { in: groupIds } }],
        },
        select: { id: true },
    });
    return Boolean(permission);
}
async function hasFileAccess(fileId, userId) {
    const file = await prisma_1.prisma.file.findUnique({
        where: { id: fileId },
        select: { folderId: true },
    });
    if (!file)
        return false;
    const groupIds = await getGroupIdsForUser(userId);
    const directFilePermission = await prisma_1.prisma.filePermission.findFirst({
        where: {
            fileId,
            OR: [{ userId }, { groupId: { in: groupIds } }],
        },
        select: { id: true },
    });
    if (directFilePermission)
        return true;
    return hasFolderAccess(file.folderId, userId);
}
async function getAccessibleFolders(userId) {
    const groupIds = await getGroupIdsForUser(userId);
    return prisma_1.prisma.folder.findMany({
        where: {
            permissions: {
                some: {
                    OR: [{ userId }, { groupId: { in: groupIds } }],
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getAccessibleFiles(userId) {
    const groupIds = await getGroupIdsForUser(userId);
    return prisma_1.prisma.file.findMany({
        where: {
            OR: [
                {
                    permissions: {
                        some: {
                            OR: [{ userId }, { groupId: { in: groupIds } }],
                        },
                    },
                },
                {
                    folder: {
                        permissions: {
                            some: {
                                OR: [{ userId }, { groupId: { in: groupIds } }],
                            },
                        },
                    },
                },
            ],
        },
        orderBy: { createdAt: "desc" },
    });
}

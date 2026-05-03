import { prisma } from "../lib/prisma";

export async function getGroupIdsForUser(userId: string) {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true },
  });

  return memberships.map((membership) => membership.groupId);
}

export async function hasFolderAccess(folderId: string, userId: string) {
  const groupIds = await getGroupIdsForUser(userId);

  const permission = await prisma.folderPermission.findFirst({
    where: {
      folderId,
      OR: [{ userId }, { groupId: { in: groupIds } }],
    },
    select: { id: true },
  });

  return Boolean(permission);
}

export async function hasFileAccess(fileId: string, userId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: { folderId: true },
  });
  if (!file) return false;

  const groupIds = await getGroupIdsForUser(userId);

  const directFilePermission = await prisma.filePermission.findFirst({
    where: {
      fileId,
      OR: [{ userId }, { groupId: { in: groupIds } }],
    },
    select: { id: true },
  });
  if (directFilePermission) return true;

  return hasFolderAccess(file.folderId, userId);
}

export async function getAccessibleFolders(userId: string) {
  const groupIds = await getGroupIdsForUser(userId);

  return prisma.folder.findMany({
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

export async function getAccessibleFiles(userId: string) {
  const groupIds = await getGroupIdsForUser(userId);

  return prisma.file.findMany({
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

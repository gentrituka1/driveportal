export type SessionUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

export type StoredSession = {
  token: string;
  user: SessionUser;
};

export type UserItem = {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
};

export type GroupItem = {
  id: string;
  name: string;
  members: string[];
};

export type FolderItem = {
  id: string;
  name: string;
};

export type FileItem = {
  id: string;
  folderId: string;
  originalName: string;
  size: number;
};

export type DashboardData = {
  folders: FolderItem[];
  files: FileItem[];
};

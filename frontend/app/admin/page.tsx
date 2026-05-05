"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import TopBar from "../../components/TopBar";
import { useToast } from "../../components/ToastProvider";
import { ApiError, apiRequest } from "../../lib/api";
import { clearSession, useStoredSession } from "../../lib/session";
import type { FileItem, FolderItem, GroupItem, SessionUser, UserItem } from "../../lib/types";

type AdminAction =
  | "loadAdminData"
  | "createUser"
  | "createGroup"
  | "addMember"
  | "createFolder"
  | "upload"
  | "assignFilePermission"
  | "assignFolderPermission"
  | "deleteFile"
  | "deleteFolder"
  | "revokeFilePermission"
  | "revokeFolderPermission";

export default function AdminPage() {
  const router = useRouter();
  const { toastError, toastSuccess } = useToast();
  const session = useStoredSession();
  const token = session?.token ?? "";
  const sessionUser: SessionUser | null = session?.user ?? null;
  const [status, setStatus] = useState("idle");

  const [users, setUsers] = useState<UserItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"USER" | "ADMIN">("USER");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [permissionTargetType, setPermissionTargetType] = useState<"user" | "group">("user");
  const [permissionUserId, setPermissionUserId] = useState("");
  const [permissionGroupId, setPermissionGroupId] = useState("");
  const [permissionFileId, setPermissionFileId] = useState("");
  const [folderPermissionTargetType, setFolderPermissionTargetType] = useState<"user" | "group">("user");
  const [folderPermissionFolderId, setFolderPermissionFolderId] = useState("");
  const [folderPermissionUserId, setFolderPermissionUserId] = useState("");
  const [folderPermissionGroupId, setFolderPermissionGroupId] = useState("");
  const [deleteFileId, setDeleteFileId] = useState("");
  const [deleteFolderId, setDeleteFolderId] = useState("");
  const [revokeFileId, setRevokeFileId] = useState("");
  const [revokeFilePermissionId, setRevokeFilePermissionId] = useState("");
  const [revokeFolderId, setRevokeFolderId] = useState("");
  const [revokeFolderPermissionId, setRevokeFolderPermissionId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<AdminAction | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    if (sessionUser?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [router, token, sessionUser?.role]);

  useEffect(() => {
    if (!token) return;
    void loadAdminData(token);
  }, [token]);

  function handleApiError(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }
      if (error.status === 403) {
        router.replace("/dashboard");
        return;
      }
      setStatus(error.message);
      toastError(error.message);
      return;
    }
    setStatus(fallback);
    toastError(fallback);
  }

  async function loadAdminData(activeToken: string, manageBusy = true) {
    if (manageBusy) {
      setIsBusy(true);
      setActiveAction("loadAdminData");
    }
    setStatus("Loading admin data...");
    try {
      const [usersPayload, groupsPayload, foldersPayload, filesPayload] = await Promise.all([
        apiRequest<{ users: UserItem[] }>("/api/admin/users", activeToken),
        apiRequest<{ groups: GroupItem[] }>("/api/admin/groups", activeToken),
        apiRequest<{ folders: FolderItem[] }>("/api/admin/folders", activeToken),
        apiRequest<{ files: FileItem[] }>("/api/admin/files", activeToken),
      ]);

      setUsers(usersPayload.users ?? []);
      setGroups(groupsPayload.groups ?? []);
      setFolders(foldersPayload.folders ?? []);
      setFiles(filesPayload.files ?? []);
      setStatus("Admin data loaded.");
    } catch (error) {
      handleApiError(error, "Failed to load admin data.");
    } finally {
      if (manageBusy) {
        setIsBusy(false);
        setActiveAction(null);
      }
    }
  }

  function logout() {
    clearSession();
    router.replace("/login");
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!newUserEmail || !newUserPassword) {
      setStatus("User email and password are required.");
      return;
    }

    setIsBusy(true);
    setActiveAction("createUser");
    setStatus("Creating user...");
    try {
      await apiRequest("/api/admin/users", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      setNewUserEmail("");
      setNewUserPassword("");
      setStatus("User created.");
      toastSuccess("User created successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "User creation failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!newGroupName) {
      setStatus("Group name is required.");
      return;
    }

    setIsBusy(true);
    setActiveAction("createGroup");
    setStatus("Creating group...");
    try {
      await apiRequest("/api/admin/groups", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      setNewGroupName("");
      setStatus("Group created.");
      toastSuccess("Group created successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Group creation failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function addMember(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!selectedGroupId || !memberUserId) {
      setStatus("Select a group and a user first.");
      return;
    }

    setIsBusy(true);
    setActiveAction("addMember");
    setStatus("Adding user to group...");
    try {
      await apiRequest(`/api/admin/groups/${selectedGroupId}/members`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberUserId }),
      });
      setStatus("Group membership updated.");
      toastSuccess("User added to group successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Adding member failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function createFolder(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!newFolderName) {
      setStatus("Folder name is required.");
      return;
    }

    setIsBusy(true);
    setActiveAction("createFolder");
    setStatus("Creating folder...");
    try {
      await apiRequest("/api/admin/folders", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      setNewFolderName("");
      setStatus("Folder created.");
      toastSuccess("Folder created successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Folder creation failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!uploadFolderId || !uploadFile) {
      setStatus("Select folder and file first.");
      return;
    }

    setIsBusy(true);
    setActiveAction("upload");
    setStatus("Uploading file...");
    try {
      const formData = new FormData();
      formData.append("folderId", uploadFolderId);
      formData.append("file", uploadFile);

      await apiRequest("/api/admin/files/upload", token, {
        method: "POST",
        body: formData,
      });
      setUploadFile(null);
      setUploadFolderId("");
      setStatus("File uploaded.");
      toastSuccess("File uploaded successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Upload failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function assignFilePermission(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!permissionFileId) {
      setStatus("Select a file first.");
      return;
    }

    if (permissionTargetType === "user" && !permissionUserId) {
      setStatus("Select a user for permission assignment.");
      return;
    }

    if (permissionTargetType === "group" && !permissionGroupId) {
      setStatus("Select a group for permission assignment.");
      return;
    }

    const payload =
      permissionTargetType === "user" ? { userId: permissionUserId } : { groupId: permissionGroupId };

    setIsBusy(true);
    setActiveAction("assignFilePermission");
    setStatus("Assigning file permission...");
    try {
      await apiRequest(`/api/admin/files/${permissionFileId}/permissions`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("Permission assigned.");
      toastSuccess("File permission assigned successfully.");
      setPermissionFileId("");
      setPermissionUserId("");
      setPermissionGroupId("");
    } catch (error) {
      handleApiError(error, "Permission assignment failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function assignFolderPermission(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!folderPermissionFolderId) {
      setStatus("Select a folder first.");
      return;
    }

    if (folderPermissionTargetType === "user" && !folderPermissionUserId) {
      setStatus("Select a user for folder permission.");
      return;
    }

    if (folderPermissionTargetType === "group" && !folderPermissionGroupId) {
      setStatus("Select a group for folder permission.");
      return;
    }

    const payload =
      folderPermissionTargetType === "user"
        ? { userId: folderPermissionUserId }
        : { groupId: folderPermissionGroupId };

    setIsBusy(true);
    setActiveAction("assignFolderPermission");
    setStatus("Assigning folder permission...");
    try {
      await apiRequest(`/api/admin/folders/${folderPermissionFolderId}/permissions`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("Folder permission assigned.");
      toastSuccess("Folder permission assigned successfully.");
      setFolderPermissionFolderId("");
      setFolderPermissionUserId("");
      setFolderPermissionGroupId("");
    } catch (error) {
      handleApiError(error, "Folder permission assignment failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function deleteFile(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!deleteFileId) {
      setStatus("Select a file to delete.");
      return;
    }

    setIsBusy(true);
    setActiveAction("deleteFile");
    setStatus("Deleting file...");
    try {
      await apiRequest(`/api/admin/files/${deleteFileId}`, token, {
        method: "DELETE",
      });
      setDeleteFileId("");
      setStatus("File deleted.");
      toastSuccess("File deleted successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "File deletion failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function deleteFolder(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!deleteFolderId) {
      setStatus("Select a folder to delete.");
      return;
    }

    setIsBusy(true);
    setActiveAction("deleteFolder");
    setStatus("Deleting folder...");
    try {
      await apiRequest(`/api/admin/folders/${deleteFolderId}`, token, {
        method: "DELETE",
      });
      setDeleteFolderId("");
      setStatus("Folder deleted.");
      toastSuccess("Folder deleted successfully.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Folder deletion failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function revokeFilePermission(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!revokeFileId || !revokeFilePermissionId) {
      setStatus("Provide file and file permission ID.");
      return;
    }

    setIsBusy(true);
    setActiveAction("revokeFilePermission");
    setStatus("Revoking file permission...");
    try {
      await apiRequest(`/api/admin/files/${revokeFileId}/permissions/${revokeFilePermissionId}`, token, {
        method: "DELETE",
      });
      setRevokeFilePermissionId("");
      setStatus("File permission revoked.");
      toastSuccess("File permission revoked successfully.");
    } catch (error) {
      handleApiError(error, "File permission revoke failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  async function revokeFolderPermission(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (isBusy) return;
    if (!revokeFolderId || !revokeFolderPermissionId) {
      setStatus("Provide folder and folder permission ID.");
      return;
    }

    setIsBusy(true);
    setActiveAction("revokeFolderPermission");
    setStatus("Revoking folder permission...");
    try {
      await apiRequest(`/api/admin/folders/${revokeFolderId}/permissions/${revokeFolderPermissionId}`, token, {
        method: "DELETE",
      });
      setRevokeFolderPermissionId("");
      setStatus("Folder permission revoked.");
      toastSuccess("Folder permission revoked successfully.");
    } catch (error) {
      handleApiError(error, "Folder permission revoke failed.");
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  return (
    <main className="app-shell">
      <TopBar
        title="DrivePortal Admin"
        subtitle={sessionUser ? sessionUser.email : "Loading session..."}
        navItems={[{ href: "/dashboard", label: "Dashboard" }]}
        onLogout={logout}
      />

      <section className="hero">
        <h2 className="text-2xl font-semibold tracking-tight">Control center</h2>
        <p className="mt-2 max-w-3xl subtle">
          Manage users, groups, folders, uploads, and permissions from one place. Standard users remain read-only and only
          access what you assign.
        </p>
      </section>

      <section className="panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Admin data</h2>
          <button
            className="btn btn-primary"
            onClick={() => token && loadAdminData(token)}
            disabled={isBusy}
            type="button"
          >
            {activeAction === "loadAdminData" ? "Refreshing admin data..." : "Refresh"}
          </button>
        </div>
        <StatusNotice value={status} />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="kpi">
            <h3 className="text-xs font-semibold uppercase tracking-wide opacity-75">Users</h3>
            <p className="mt-1 text-2xl font-semibold">{users.length}</p>
            <ul className="mt-2 max-h-28 overflow-auto text-xs">
              {users.length === 0 ? <li className="subtle">No users yet.</li> : null}
              {users.map((item) => (
                <li key={item.id}>
                  {item.email} ({item.role})
                </li>
              ))}
            </ul>
          </div>
          <div className="kpi">
            <h3 className="text-xs font-semibold uppercase tracking-wide opacity-75">Groups</h3>
            <p className="mt-1 text-2xl font-semibold">{groups.length}</p>
            <ul className="mt-2 max-h-28 overflow-auto text-xs">
              {groups.length === 0 ? <li className="subtle">No groups yet.</li> : null}
              {groups.map((item) => (
                <li key={item.id}>
                  {item.name} ({item.members.length} members)
                </li>
              ))}
            </ul>
          </div>
          <div className="kpi">
            <h3 className="text-xs font-semibold uppercase tracking-wide opacity-75">Folders</h3>
            <p className="mt-1 text-2xl font-semibold">{folders.length}</p>
            <ul className="mt-2 max-h-28 overflow-auto text-xs">
              {folders.length === 0 ? <li className="subtle">No folders yet.</li> : null}
              {folders.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
          <div className="kpi">
            <h3 className="text-xs font-semibold uppercase tracking-wide opacity-75">Files</h3>
            <p className="mt-1 text-2xl font-semibold">{files.length}</p>
            <ul className="mt-2 max-h-28 overflow-auto text-xs">
              {files.length === 0 ? <li className="subtle">No files uploaded yet.</li> : null}
              {files.map((item) => (
                <li key={item.id}>
                  {item.originalName} ({Math.ceil(item.size / 1024)} KB)
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="form-grid">
        <form className="form-card" onSubmit={createUser}>
          <h3 className="section-title">Create user</h3>
          <p className="subtle">Create platform users with USER or ADMIN roles.</p>
          <div className="form-fields">
          <input
            className="input"
            placeholder="User email"
            type="email"
            value={newUserEmail}
            onChange={(event) => setNewUserEmail(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min 8)"
            value={newUserPassword}
            onChange={(event) => setNewUserPassword(event.target.value)}
            required
          />
          <select
            className="input"
            value={newUserRole}
            onChange={(event) => setNewUserRole(event.target.value as "USER" | "ADMIN")}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          </div>
          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "createUser" ? "Creating user..." : "Create user"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={createGroup}>
          <h3 className="section-title">Create group</h3>
          <p className="subtle">Groups simplify permission assignment to multiple users.</p>
          <div className="form-fields">
          <input
            className="input"
            placeholder="Group name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            required
          />
          </div>
          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "createGroup" ? "Creating group..." : "Create group"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={addMember}>
          <h3 className="section-title">Add group member</h3>
          <p className="subtle">Attach an existing USER account to a group.</p>
          <div className="form-fields">
          <select
            className="input"
            value={selectedGroupId}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            required
          >
            <option value="">Select group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <select className="input" value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)} required>
            <option value="">Select user</option>
            {users
              .filter((item) => item.role === "USER")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.email}
                </option>
              ))}
          </select>
          </div>
          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "addMember" ? "Adding member..." : "Add member"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={createFolder}>
          <h3 className="section-title">Create folder</h3>
          <p className="subtle">Create a top-level folder for organized distribution.</p>
          <div className="form-fields">
          <input
            className="input"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            required
          />
          </div>
          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "createFolder" ? "Creating folder..." : "Create folder"}
          </button>
          </div>
        </form>
      </section>

      <section className="form-grid">
        <form className="form-card" onSubmit={assignFolderPermission}>
          <h3 className="section-title">Assign folder permission</h3>
          <p className="subtle">Grant folder access to user or group (best for dashboard visibility).</p>
          <div className="form-fields">
          <select
            className="input"
            value={folderPermissionFolderId}
            onChange={(event) => setFolderPermissionFolderId(event.target.value)}
            required
          >
            <option value="">Select folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={folderPermissionTargetType}
            onChange={(event) => {
              const nextType = event.target.value as "user" | "group";
              setFolderPermissionTargetType(nextType);
              if (nextType === "user") {
                setFolderPermissionGroupId("");
              } else {
                setFolderPermissionUserId("");
              }
            }}
          >
            <option value="user">Assign to user</option>
            <option value="group">Assign to group</option>
          </select>

          {folderPermissionTargetType === "user" ? (
            <select
              className="input"
              value={folderPermissionUserId}
              onChange={(event) => setFolderPermissionUserId(event.target.value)}
              required
            >
              <option value="">Select user</option>
              {users
                .filter((item) => item.role === "USER")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.email}
                  </option>
                ))}
            </select>
          ) : (
            <select
              className="input"
              value={folderPermissionGroupId}
              onChange={(event) => setFolderPermissionGroupId(event.target.value)}
              required
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          </div>

          <div className="form-actions">
          <button className="btn btn-secondary" disabled={isBusy} type="submit">
            {activeAction === "assignFolderPermission" ? "Assigning folder permission..." : "Assign folder permission"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={upload}>
          <h3 className="section-title">Upload file</h3>
          <p className="subtle">Upload any file type and bind it to a folder.</p>
          <div className="form-fields">
          <select
            className="input"
            value={uploadFolderId}
            onChange={(event) => setUploadFolderId(event.target.value)}
            required
          >
            <option value="">Select folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="file"
            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            required
          />
          </div>
          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "upload" ? "Uploading file..." : "Upload"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={assignFilePermission}>
          <h3 className="section-title">Assign file permission</h3>
          <p className="subtle">Grant view/download access to a user or group.</p>
          <div className="form-fields">
          <select
            className="input"
            value={permissionFileId}
            onChange={(event) => setPermissionFileId(event.target.value)}
            required
          >
            <option value="">Select file</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.originalName}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={permissionTargetType}
            onChange={(event) => {
              const nextType = event.target.value as "user" | "group";
              setPermissionTargetType(nextType);
              if (nextType === "user") {
                setPermissionGroupId("");
              } else {
                setPermissionUserId("");
              }
            }}
          >
            <option value="user">Assign to user</option>
            <option value="group">Assign to group</option>
          </select>

          {permissionTargetType === "user" ? (
            <select
              className="input"
              value={permissionUserId}
              onChange={(event) => setPermissionUserId(event.target.value)}
              required
            >
              <option value="">Select user</option>
              {users
                .filter((item) => item.role === "USER")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.email}
                  </option>
                ))}
            </select>
          ) : (
            <select
              className="input"
              value={permissionGroupId}
              onChange={(event) => setPermissionGroupId(event.target.value)}
              required
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
          </div>

          <div className="form-actions">
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            {activeAction === "assignFilePermission" ? "Assigning file permission..." : "Assign permission"}
          </button>
          </div>
        </form>
      </section>

      <section className="form-grid">
        <form className="form-card" onSubmit={deleteFile}>
          <h3 className="section-title">Delete file</h3>
          <p className="subtle">Calls <code>/api/admin/files/:fileId</code>.</p>
          <div className="form-fields">
          <select className="input" value={deleteFileId} onChange={(event) => setDeleteFileId(event.target.value)} required>
            <option value="">Select file</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.originalName}
              </option>
            ))}
          </select>
          </div>
          <div className="form-actions">
          <button className="btn btn-secondary" disabled={isBusy} type="submit">
            {activeAction === "deleteFile" ? "Deleting file..." : "Delete file"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={deleteFolder}>
          <h3 className="section-title">Delete folder</h3>
          <p className="subtle">Calls <code>/api/admin/folders/:folderId</code>.</p>
          <div className="form-fields">
          <select className="input" value={deleteFolderId} onChange={(event) => setDeleteFolderId(event.target.value)} required>
            <option value="">Select folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          </div>
          <div className="form-actions">
          <button className="btn btn-secondary" disabled={isBusy} type="submit">
            {activeAction === "deleteFolder" ? "Deleting folder..." : "Delete folder"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={revokeFilePermission}>
          <h3 className="section-title">Revoke file permission</h3>
          <p className="subtle">Use file + permission IDs from API responses/logs.</p>
          <div className="form-fields">
          <select className="input" value={revokeFileId} onChange={(event) => setRevokeFileId(event.target.value)} required>
            <option value="">Select file</option>
            {files.map((file) => (
              <option key={file.id} value={file.id}>
                {file.originalName}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Permission ID"
            value={revokeFilePermissionId}
            onChange={(event) => setRevokeFilePermissionId(event.target.value)}
            required
          />
          </div>
          <div className="form-actions">
          <button className="btn btn-secondary" disabled={isBusy} type="submit">
            {activeAction === "revokeFilePermission" ? "Revoking file permission..." : "Revoke file permission"}
          </button>
          </div>
        </form>

        <form className="form-card" onSubmit={revokeFolderPermission}>
          <h3 className="section-title">Revoke folder permission</h3>
          <p className="subtle">Use folder + permission IDs from API responses/logs.</p>
          <div className="form-fields">
          <select className="input" value={revokeFolderId} onChange={(event) => setRevokeFolderId(event.target.value)} required>
            <option value="">Select folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Permission ID"
            value={revokeFolderPermissionId}
            onChange={(event) => setRevokeFolderPermissionId(event.target.value)}
            required
          />
          </div>
          <div className="form-actions">
          <button className="btn btn-secondary" disabled={isBusy} type="submit">
            {activeAction === "revokeFolderPermission" ? "Revoking folder permission..." : "Revoke folder permission"}
          </button>
          </div>
        </form>
      </section>
    </main>
  );
}

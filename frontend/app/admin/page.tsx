"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusNotice from "../../components/StatusNotice";
import TopBar from "../../components/TopBar";
import { ApiError, apiRequest } from "../../lib/api";
import { clearSession, loadSession } from "../../lib/session";
import type { FileItem, FolderItem, GroupItem, SessionUser, UserItem } from "../../lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
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
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    setToken(session.token);
    setSessionUser(session.user);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    void loadAdminData(token);
  }, [token]);

  useEffect(() => {
    if (permissionTargetType === "user") {
      setPermissionGroupId("");
    } else {
      setPermissionUserId("");
    }
  }, [permissionTargetType]);

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
      return;
    }
    setStatus(fallback);
  }

  async function loadAdminData(activeToken: string, manageBusy = true) {
    if (manageBusy) {
      setIsBusy(true);
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
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "User creation failed.");
    } finally {
      setIsBusy(false);
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
    setStatus("Creating group...");
    try {
      await apiRequest("/api/admin/groups", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      setNewGroupName("");
      setStatus("Group created.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Group creation failed.");
    } finally {
      setIsBusy(false);
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
    setStatus("Adding user to group...");
    try {
      await apiRequest(`/api/admin/groups/${selectedGroupId}/members`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberUserId }),
      });
      setStatus("Group membership updated.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Adding member failed.");
    } finally {
      setIsBusy(false);
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
    setStatus("Creating folder...");
    try {
      await apiRequest("/api/admin/folders", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      setNewFolderName("");
      setStatus("Folder created.");
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Folder creation failed.");
    } finally {
      setIsBusy(false);
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
      await loadAdminData(token, false);
    } catch (error) {
      handleApiError(error, "Upload failed.");
    } finally {
      setIsBusy(false);
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
    setStatus("Assigning file permission...");
    try {
      await apiRequest(`/api/admin/files/${permissionFileId}/permissions`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus("Permission assigned.");
      setPermissionFileId("");
      setPermissionUserId("");
      setPermissionGroupId("");
    } catch (error) {
      handleApiError(error, "Permission assignment failed.");
    } finally {
      setIsBusy(false);
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
            {isBusy ? "Working..." : "Refresh"}
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

      <section className="grid gap-4 md:grid-cols-2">
        <form className="panel grid gap-2" onSubmit={createUser}>
          <h3 className="section-title">Create user</h3>
          <p className="subtle">Create platform users with USER or ADMIN roles.</p>
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
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Create user
          </button>
        </form>

        <form className="panel grid gap-2" onSubmit={createGroup}>
          <h3 className="section-title">Create group</h3>
          <p className="subtle">Groups simplify permission assignment to multiple users.</p>
          <input
            className="input"
            placeholder="Group name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
            required
          />
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Create group
          </button>
        </form>

        <form className="panel grid gap-2" onSubmit={addMember}>
          <h3 className="section-title">Add group member</h3>
          <p className="subtle">Attach an existing USER account to a group.</p>
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
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Add member
          </button>
        </form>

        <form className="panel grid gap-2" onSubmit={createFolder}>
          <h3 className="section-title">Create folder</h3>
          <p className="subtle">Create a top-level folder for organized distribution.</p>
          <input
            className="input"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            required
          />
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Create folder
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form className="panel grid gap-2" onSubmit={upload}>
          <h3 className="section-title">Upload file</h3>
          <p className="subtle">Upload any file type and bind it to a folder.</p>
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
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Upload
          </button>
        </form>

        <form className="panel grid gap-2" onSubmit={assignFilePermission}>
          <h3 className="section-title">Assign file permission</h3>
          <p className="subtle">Grant view/download access to a user or group.</p>
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
            onChange={(event) => setPermissionTargetType(event.target.value as "user" | "group")}
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

          <button className="btn btn-primary" disabled={isBusy} type="submit">
            Assign permission
          </button>
        </form>
      </section>
    </main>
  );
}

# DrivePortal Backend (Express)

## Implemented MVP endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/admin/users` (ADMIN)
- `POST /api/admin/users` (ADMIN)
- `GET /api/admin/groups` (ADMIN)
- `POST /api/admin/groups` (ADMIN)
- `POST /api/admin/groups/:groupId/members` (ADMIN)
- `GET /api/admin/folders` (ADMIN)
- `POST /api/admin/folders` (ADMIN)
- `GET /api/admin/files` (ADMIN)
- `POST /api/admin/files/upload` (ADMIN, multipart: `file`, `folderId`)
- `POST /api/admin/folders/:folderId/permissions` (ADMIN)
- `POST /api/admin/files/:fileId/permissions` (ADMIN)
- `DELETE /api/admin/folders/:folderId/permissions/:permissionId` (ADMIN)
- `DELETE /api/admin/files/:fileId/permissions/:permissionId` (ADMIN)
- `DELETE /api/admin/files/:fileId` (ADMIN)
- `DELETE /api/admin/folders/:folderId` (ADMIN)
- `GET /api/me/dashboard` (AUTH)
- `GET /api/me/files/:fileId/download` (AUTH)

## Security behavior

- RBAC enforced server-side with `403` on forbidden admin actions.
- Self-registration (when enabled) creates only `USER` accounts; `ADMIN` accounts are admin-created only.
- Downloads force browser-safe attachment behavior in local mode:
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment`

## Setup notes

- PostgreSQL + Prisma are used for users, groups, folders, files, and permissions.
- Run `npx prisma migrate dev` to apply schema migrations on new environments.
- Run `npm run seed:admin` once to create the default admin user when the database is empty.

## Next production steps

- Add refresh tokens, password reset, account lockout.
- Move local file storage to S3 and use `GetObject` signed URLs.
- Add auditing for uploads/downloads/permission changes.

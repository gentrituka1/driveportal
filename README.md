# DrivePortal MVP

This workspace contains:

- `backend`: Express.js API (RBAC, auth, admin/user flows, file upload/download)
- `frontend`: Next.js app router frontend starter wired to the backend

## 1) Run backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma migrate dev
npm run seed:admin
npm run dev
```

Default seeded admin:

- email: `admin@driveportal.local`
- password: `Admin123!`

## 2) Run frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

## Notes

- The backend uses PostgreSQL via Prisma.
- Seed the default admin once with `npm run seed:admin`.
- Local storage mode saves files under `backend/uploads`.
- For production file storage, set `STORAGE_DRIVER=s3` with your S3 bucket settings.

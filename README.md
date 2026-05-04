# DrivePortal MVP

This workspace contains:

- `backend`: Express.js API (RBAC, auth, admin/user flows, file upload/download)
- `frontend`: Next.js app router frontend starter wired to the backend

## Run with Docker (recommended)

Run the full stack (Postgres + backend + frontend):

```bash
docker compose up --build
```

App URLs:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4000`
- backend health: `http://localhost:4000/health`

Default seeded admin:

- email: `admin@driveportal.local`
- password: `Admin123!`

Stop containers:

```bash
docker compose down
```

Stop and remove DB volume (full reset):

```bash
docker compose down -v
```

## Run locally (optional)

### 1) Run backend

```bash
cd backend
cp/copy .env.example .env
npm install
npx prisma migrate dev
npm run seed:admin
npm run dev
```

Default seeded admin:

- email: `admin@driveportal.local`
- password: `Admin123!`

### 2) Run frontend

```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > .env.local
npm install
npm run dev
```

## Notes

- The backend uses PostgreSQL via Prisma.
- Seed the default admin once with `npm run seed:admin`.
- Local storage mode saves files under `backend/uploads`.
- For production file storage, set `STORAGE_DRIVER=s3` with your S3 bucket settings.

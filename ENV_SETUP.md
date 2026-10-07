# Environment setup

AssetHub uses a same-origin `/api` in local development and on Vercel. The frontend requires no API environment variable.

Copy `backend/.env.example` to `backend/.env` for development and fill the values locally. Never commit a populated environment file.

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | PostgreSQL connection. Use a pooled URL appropriate to the host. |
| JWT_SECRET | Private random signing secret; required for all authentication. |
| APP_URL | Stable public application origin used by invitations and QR labels. Locally use http://localhost:5173. |
| PORT | Local API port; defaults to 5000. |
| HOST | Local listen address; use 127.0.0.1 for loopback-only access. |

Vercel supplies its production-domain environment automatically. `APP_URL` may explicitly override it. A Vercel deployment uses the existing project environment; do not put secrets in vercel.json. `VITE_API_URL` from the old application is unused.

Run reviewed migrations separately before deploying application code. No seed or database reset runs during a build. See [deployment and rollback](docs/overhaul/deployment.md).

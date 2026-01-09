# Multi-Tenant Asset Manager

A full-stack asset management system with multi-tenant architecture, built with React, Node.js, Express, Prisma, and PostgreSQL.

## Features

- 🔐 JWT-based authentication
- 🏢 Multi-tenant data isolation
- 📦 CRUD operations for assets
- 🎨 Modern React UI with Tailwind CSS
- 🔒 Secure password hashing (bcrypt)
- 🚀 Deployed on Railway (backend) and Vercel (frontend)

## Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Axios

**Backend:**
- Node.js
- Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT authentication
- bcryptjs

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd multi-tenant-asset-manager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file (see Environment Variables below)
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create .env file (see Environment Variables below)
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/asset_manager
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

### Using Supabase

1. Create a Supabase project
2. Run `SUPABASE_SETUP.sql` in Supabase SQL Editor (creates tables)
3. Run `SUPABASE_SEED.sql` in Supabase SQL Editor (creates test data)

### Test Credentials
- **Acme Corp**: `admin@acme.com` / `password123`
- **Globex Corp**: `hank@globex.com` / `password123`

## Deployment

### Backend (Railway)

1. Connect GitHub repo to Railway
2. Set **Root Directory** to `backend`
3. Set **Start Command** to `npm start`
4. Add environment variables:
   - `DATABASE_URL` (Supabase connection string)
   - `JWT_SECRET`
   - `NODE_ENV=production`

See `RAILWAY_DEPLOYMENT.md` for detailed steps.

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` (your Railway backend URL + `/api`)

## Project Structure

```
multi-tenant-asset-manager/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── db/             # Prisma client
│   │   └── server.js       # Express server
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.js         # Seed script
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── api/           # Axios configuration
│       └── App.jsx        # Main app component
└── SUPABASE_SETUP.sql     # Database schema SQL
└── SUPABASE_SEED.sql      # Seed data SQL
```

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/assets` - Get all assets (protected)
- `POST /api/assets` - Create asset (protected)
- `PATCH /api/assets/:id` - Update asset (protected)
- `DELETE /api/assets/:id` - Delete asset (protected)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Multi-tenant data isolation
- Input validation
- CORS configuration

## Documentation

- `RAILWAY_DEPLOYMENT.md` - Complete Railway deployment guide
- `ENV_SETUP.md` - Environment variables reference

## License

ISC

# Environment Variables Setup

## Backend (.env file in `backend/` directory)

Create `backend/.env` with:

```env
# Database Connection (from Supabase)
# Format: postgresql://user:password@host:port/database?sslmode=require
DATABASE_URL=postgresql://postgres:password@localhost:5432/asset_manager

# JWT Secret (generate a strong random string)
# Use: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Environment
NODE_ENV=development

# Frontend URL (for CORS in production)
FRONTEND_URL=http://localhost:5173
```

## Frontend (.env file in `frontend/` directory)

Create `frontend/.env` with:

```env
# Backend API URL
# For production: Your Render backend URL (e.g., https://your-app.onrender.com)
# For development: http://localhost:5000
VITE_API_URL=http://localhost:5000/api
```

## Production Environment Variables

### Render (Backend)
- `DATABASE_URL` - Supabase connection string
- `JWT_SECRET` - Strong random secret
- `NODE_ENV` - `production`
- `PORT` - `10000` (or leave empty)
- `FRONTEND_URL` - Your Vercel URL (optional, for CORS)

### Vercel (Frontend)
- `VITE_API_URL` - Your Render backend URL + `/api`

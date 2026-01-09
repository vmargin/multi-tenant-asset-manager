# Deployment Guide

This guide covers deploying the Multi-Tenant Asset Manager to:
- **Supabase** - PostgreSQL Database
- **Render** - Backend API
- **Vercel** - Frontend

## Prerequisites

- GitHub account (for connecting repositories)
- Supabase account (free tier available)
- Render account (free tier available)
- Vercel account (free tier available)

---

## Step 1: Deploy Database to Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `multi-tenant-asset-manager`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Copy the **URI** connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Add `?sslmode=require` at the end for SSL:
   ```
   postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```
6. **Save this** - you'll need it for Render

### 1.3 Run Prisma Migrations

**Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/prisma/migrations/20260108082121_init_tables/migration.sql`
3. Paste and run it
4. Copy and run `backend/prisma/migrations/20260108083405_sync_schema_with_slug/migration.sql`

**Option B: Using Prisma CLI locally**

1. Create `backend/.env` with your Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```
2. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
3. Seed the database:
   ```bash
   npx prisma db seed
   ```

---

## Step 2: Deploy Backend to Render

### 2.1 Prepare Repository

1. Push your code to GitHub (if not already)
2. Make sure `render.yaml` is in the root directory

### 2.2 Create Render Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will detect `render.yaml` automatically
5. If not, configure manually:
   - **Name**: `multi-tenant-asset-manager-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if issues)

### 2.3 Configure Environment Variables

In Render dashboard, go to **Environment** tab and add:

1. **DATABASE_URL**
   - Value: Your Supabase connection string from Step 1.2
   - Format: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require`

2. **JWT_SECRET**
   - Generate a strong secret:
     ```bash
     openssl rand -base64 32
     ```
   - Or use: [randomkeygen.com](https://randomkeygen.com)
   - **Important**: Use a different secret than development!

3. **NODE_ENV**
   - Value: `production`

4. **PORT**
   - Value: `10000` (Render default, or leave empty)

### 2.4 Deploy

1. Click "Create Web Service"
2. Render will build and deploy (takes ~5-10 minutes)
3. Once deployed, you'll get a URL like: `https://multi-tenant-asset-manager-api.onrender.com`
4. **Save this URL** - you'll need it for Vercel

### 2.5 Test Backend

1. Visit: `https://your-app.onrender.com/api/assets`
2. Should return `401 Unauthorized` (expected - no token)
3. If you see an error, check Render logs

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Frontend

1. Make sure `vercel.json` is in the root directory
2. Update `frontend/src/api/axios.js` uses environment variable (already done)

### 3.2 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite (or Other)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Configure Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables**:

1. **VITE_API_URL**
   - Value: `https://your-render-app.onrender.com/api`
   - Replace `your-render-app` with your actual Render service name
   - **Important**: Include `/api` at the end!

### 3.4 Deploy

1. Click "Deploy"
2. Vercel will build and deploy (takes ~2-3 minutes)
3. You'll get a URL like: `https://multi-tenant-asset-manager.vercel.app`

### 3.5 Test Frontend

1. Visit your Vercel URL
2. Try logging in with:
   - Email: `admin@acme.com`
   - Password: `password123`
3. Should see the dashboard with assets

---

## Step 4: Update CORS (If Needed)

If you get CORS errors, update `backend/src/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', // Local dev
    'https://your-vercel-app.vercel.app' // Production
  ],
  credentials: true
}));
```

Or allow all origins (less secure, but works):
```javascript
app.use(cors());
```

---

## Troubleshooting

### Backend Issues

**Database connection errors:**
- Verify `DATABASE_URL` is correct in Render
- Check Supabase database is running
- Ensure SSL mode is set: `?sslmode=require`

**Prisma errors:**
- Check `render.yaml` build command includes `prisma generate`
- Verify migrations ran successfully in Supabase

**Port errors:**
- Render uses port `10000` by default
- Update `server.js` to use `process.env.PORT || 5000`

### Frontend Issues

**API connection errors:**
- Verify `VITE_API_URL` in Vercel matches your Render URL
- Check CORS settings in backend
- Ensure Render service is running (not sleeping)

**Build errors:**
- Check Vercel build logs
- Verify `vercel.json` configuration
- Ensure all dependencies are in `package.json`

### Render Service Sleeping

- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Upgrade to paid plan to prevent sleeping

---

## Environment Variables Summary

### Backend (Render)
```
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-generated-secret-here
NODE_ENV=production
PORT=10000
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-render-app.onrender.com/api
```

---

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Database seeded with test data
- [ ] Backend API accessible
- [ ] Frontend connects to backend
- [ ] Login works
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Test CRUD operations

---

## Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

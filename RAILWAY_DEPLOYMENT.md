# Railway Deployment Guide

Complete guide for deploying Multi-Tenant Asset Manager to Railway (Backend) and Vercel (Frontend).

## Prerequisites

- ✅ Supabase database set up and active
- ✅ GitHub account
- ✅ Railway account (free tier available)
- ✅ Vercel account (free tier available)

---

## Step 1: Prepare Your Repository

1. Make sure all code is committed and pushed to GitHub
2. Verify these files exist in your repo:
   - `railway.json` or `railway.toml` (Railway config)
   - `backend/package.json` (with start script)
   - `backend/prisma/schema.prisma`
   - `vercel.json` (for frontend)

---

## Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `multi-tenant-asset-manager`
5. Railway will auto-detect it's a Node.js project

### 2.2 Configure Service Settings ⚠️ IMPORTANT

**CRITICAL**: Railway must use the `backend` directory as root!

1. Click on your service
2. Go to **Settings** tab
3. **Root Directory**: Set to `backend` (this is required!)
4. **Builder**: Select **Nixpacks** (not Docker)
5. **Build Command**: Leave empty (Nixpacks auto-detects Node.js)
6. **Start Command**: `npm start`

**Why?** If Root Directory is not set to `backend`, Railway will try to build from the root and may use Docker instead of Nixpacks, causing build errors.

### 2.3 Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

#### Required Variables:

1. **DATABASE_URL**

   ```
   postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

   - Get this from Supabase Dashboard → Settings → Database → Connection string (Direct connection)

2. **JWT_SECRET**

   ```
   your-super-secret-jwt-key-generate-this
   ```

   - Generate with: `openssl rand -base64 32`
   - Or use: [randomkeygen.com](https://randomkeygen.com)

3. **NODE_ENV**

   ```
   production
   ```

4. **PORT** (Optional)
   ```
   3000
   ```
   - Railway auto-assigns PORT, but you can set it explicitly

### 2.4 Add PostgreSQL Plugin (Optional)

Railway can also host your database, but since you're using Supabase:

1. Skip adding PostgreSQL plugin
2. Just use the `DATABASE_URL` from Supabase

### 2.5 Deploy

1. Railway will automatically start building when you:
   - Push to main branch, OR
   - Click **"Deploy"** button
2. Watch the build logs
3. Once deployed, Railway gives you a URL like: `https://your-app.up.railway.app`

### 2.6 Run Database Migrations

After first deployment, run migrations:

**Option A: Via Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
cd backend
railway run npx prisma migrate deploy
```

**Option B: Via Railway Dashboard**

1. Go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Use **"Shell"** tab to run commands
4. Run: `cd backend && npx prisma migrate deploy`

**Option C: Already Done**
If you already ran migrations via Supabase SQL Editor, skip this step!

### 2.7 Test Backend

1. Visit: `https://your-app.up.railway.app/api/assets`
2. Should return `401 Unauthorized` (expected - no token)
3. If error, check Railway logs

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 Set Environment Variables

In Vercel dashboard → **Settings** → **Environment Variables**:

1. **VITE_API_URL**
   ```
   https://your-railway-app.up.railway.app/api
   ```
   - Replace `your-railway-app` with your actual Railway service name
   - **Important**: Include `/api` at the end!

### 3.3 Deploy

1. Click **"Deploy"**
2. Vercel builds and deploys (takes ~2-3 minutes)
3. You'll get a URL like: `https://multi-tenant-asset-manager.vercel.app`

### 3.4 Test Frontend

1. Visit your Vercel URL
2. Try logging in:
   - Email: `admin@acme.com`
   - Password: `password123`
3. Should see the dashboard!

---

## Step 4: Update CORS (If Needed)

If you get CORS errors, update `backend/src/server.js`:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local dev
      "https://your-vercel-app.vercel.app", // Production
    ],
    credentials: true,
  })
);
```

Or temporarily allow all (less secure):

```javascript
app.use(cors());
```

Then redeploy to Railway.

---

## Step 5: Custom Domain (Optional)

### Railway Custom Domain

1. In Railway dashboard → **Settings** → **Domains**
2. Click **"Generate Domain"** or add custom domain
3. Update `VITE_API_URL` in Vercel with new domain

### Vercel Custom Domain

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS setup instructions

---

## Troubleshooting

### Backend Issues

**Build fails:**

- Check Railway build logs
- Verify `backend/package.json` has correct scripts
- Ensure Prisma is in dependencies

**Database connection errors:**

- Verify `DATABASE_URL` is correct (direct connection, not pooler)
- Check Supabase project is active
- Ensure `?sslmode=require` is in connection string

**Port errors:**

- Railway auto-assigns PORT
- Use `process.env.PORT || 5000` in server.js (already done)

**Prisma errors:**

- Run `npx prisma generate` in build command
- Ensure migrations are deployed

### Frontend Issues

**API connection errors:**

- Verify `VITE_API_URL` matches Railway URL
- Check CORS settings in backend
- Ensure Railway service is running

**Build errors:**

- Check Vercel build logs
- Verify `vercel.json` configuration
- Ensure all dependencies in `package.json`

### Railway Service Issues

**Service not starting:**

- Check Railway logs
- Verify start command is correct
- Check environment variables are set

**Cold starts:**

- Free tier services may have cold starts
- First request after inactivity takes ~10-30 seconds
- Upgrade to paid plan for faster starts

---

## Environment Variables Summary

### Railway (Backend)

```
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-generated-secret-here
NODE_ENV=production
PORT=3000 (optional, Railway auto-assigns)
```

### Vercel (Frontend)

```
VITE_API_URL=https://your-railway-app.up.railway.app/api
```

---

## Post-Deployment Checklist

- [ ] Backend deployed to Railway
- [ ] Database migrations completed
- [ ] Environment variables set in Railway
- [ ] Backend API accessible
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Frontend connects to backend
- [ ] Login works
- [ ] CORS configured correctly
- [ ] Test CRUD operations

---

## Useful Commands

### Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run command in Railway environment
railway run npm start

# Open shell
railway shell
```

### Local Testing

```bash
# Test backend locally with production DB
cd backend
DATABASE_URL="your-supabase-url" npm start

# Test frontend locally with production API
cd frontend
VITE_API_URL="https://your-railway-app.up.railway.app/api" npm run dev
```

---

## Useful Links

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

---

## Cost Estimate

**Free Tier:**

- Railway: $5 free credit/month (enough for small projects)
- Vercel: Free for personal projects
- Supabase: Free tier (500MB database, 2GB bandwidth)

**Total: $0/month** for development/small projects! 🎉

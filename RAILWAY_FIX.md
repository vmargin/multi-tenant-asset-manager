# Railway Build Error Fix

## Problem
Railway is trying to use Docker instead of Nixpacks, causing `npm: command not found` error.

## Solution

### Option 1: Configure Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Set these values:
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (Nixpacks auto-detects)
   - **Start Command**: `npm start`
5. Under **Build Settings**:
   - **Builder**: Select **Nixpacks** (not Docker)
6. Save and redeploy

### Option 2: Delete and Recreate Service

If Option 1 doesn't work:

1. Delete the current service in Railway
2. Create a new service
3. Select **"Empty Service"**
4. Connect your GitHub repo
5. In settings, set:
   - **Root Directory**: `backend`
   - **Builder**: `Nixpacks`
6. Add environment variables
7. Deploy

### Option 3: Use Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Set root directory
railway variables set RAILWAY_SERVICE_ROOT=backend

# Redeploy
railway up
```

## Why This Happens

Railway auto-detects the build system. If it sees `docker-compose.yml`, it might try Docker first. By explicitly setting:
- Root Directory to `backend`
- Builder to `Nixpacks`

Railway will use Nixpacks which auto-detects Node.js projects.

## Verify It's Working

After fixing, check the build logs. You should see:
- ✅ "Detected Node.js project"
- ✅ "Running npm install"
- ✅ "Running npx prisma generate"
- ✅ "Starting npm start"

Instead of:
- ❌ "Using Docker"
- ❌ "npm: command not found"

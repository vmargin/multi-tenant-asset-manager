# Supabase Connection Fix

## The Problem
You're using the **pooler** connection string, but Prisma migrations need the **direct** connection string.

## Solution

### Step 1: Get the Direct Connection String

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection string** section
4. Look for **Connection pooling** section
5. You'll see two options:
   - **Session mode** (pooler) - `pooler.supabase.com` ❌ Don't use for migrations
   - **Direct connection** - `db.xxxxx.supabase.co` ✅ Use this for Prisma

### Step 2: Use Direct Connection String

Copy the **URI** from the **Direct connection** section (not the pooler).

Format should be:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### Step 3: Add SSL Parameters

Add these parameters at the end:
```
?sslmode=require&sslcert=&sslkey=&sslrootcert=
```

**Full format:**
```
postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

### Step 4: Update Your .env File

In `backend/.env`, update `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

**Important:**
- Replace `yourpassword` with your actual Supabase database password
- Use `db.xxxxx.supabase.co` (direct), NOT `pooler.supabase.com`
- Make sure `?sslmode=require` is at the end

### Step 5: Test Connection

```bash
cd backend
npx prisma db push
```

Or if you want to run migrations:
```bash
npx prisma migrate deploy
```

## Alternative: Use Supabase SQL Editor

If Prisma still can't connect, you can run migrations directly in Supabase:

1. Go to Supabase dashboard → **SQL Editor**
2. Copy SQL from your migration files:
   - `backend/prisma/migrations/20260108082121_init_tables/migration.sql`
   - `backend/prisma/migrations/20260108083405_sync_schema_with_slug/migration.sql`
3. Paste and run each one

## Connection String Comparison

**❌ Pooler (for application connections):**
```
postgresql://postgres:pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**✅ Direct (for migrations/Prisma):**
```
postgresql://postgres:pass@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

## Troubleshooting

**Still can't connect?**
1. Check your Supabase project is active (not paused)
2. Verify password is correct (no special characters need URL encoding)
3. Try URL-encoding the password if it has special chars:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - etc.
4. Check firewall/network isn't blocking port 5432
5. Try using Supabase SQL Editor instead

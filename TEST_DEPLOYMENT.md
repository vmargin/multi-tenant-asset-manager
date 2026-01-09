# Testing Your Deployed Application

## Step 1: Check if Backend is Running

### Test 1: Health Check (Public Endpoint)
Open in browser or use curl:
```
https://your-railway-app.up.railway.app/api/assets
```

**Expected Response:**
- Status: `401 Unauthorized`
- Body: `{"error":"Access denied: No token"}`
- ✅ This means your backend is running! (401 is expected without auth token)

**If you get:**
- ❌ Connection error → Backend not running or wrong URL
- ❌ 404 Not Found → Check your routes
- ❌ 500 Error → Check Railway logs

---

## Step 2: Test Login Endpoint

### Test 2: Login (POST Request)

**Using Browser (not ideal, but quick):**
Can't easily test POST in browser, use one of the methods below.

**Using curl (Terminal/PowerShell):**
```bash
curl -X POST https://your-railway-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@acme.com\",\"password\":\"password123\"}"
```

**Using PowerShell (Windows):**
```powershell
$body = @{
    email = "admin@acme.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://your-railway-app.up.railway.app/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "admin@acme.com",
    "orgId": "some-uuid-here",
    "orgName": "Acme Corp"
  }
}
```

**Save the token** - you'll need it for next tests!

---

## Step 3: Test Protected Endpoints

### Test 3: Get Assets (with Authentication)

**Using curl:**
```bash
curl -X GET https://your-railway-app.up.railway.app/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Using PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "https://your-railway-app.up.railway.app/api/assets" `
  -Method GET `
  -Headers $headers
```

**Expected Response:**
```json
[]
```
(Empty array if no assets, or array of assets if seeded)

---

## Step 4: Test Frontend (After Vercel Deployment)

### Test 4: Full Application Test

1. **Visit your Vercel URL:**
   ```
   https://your-vercel-app.vercel.app
   ```

2. **Login:**
   - Email: `admin@acme.com`
   - Password: `password123`

3. **Expected:**
   - ✅ Login succeeds
   - ✅ Dashboard loads
   - ✅ See organization name (Acme Corp)
   - ✅ Can add assets
   - ✅ Can edit assets
   - ✅ Can delete assets

---

## Step 5: Test with Browser DevTools

### Test 5: Network Tab Inspection

1. Open your Vercel app in browser
2. Press `F12` to open DevTools
3. Go to **Network** tab
4. Try logging in
5. Check:
   - ✅ Login request returns 200
   - ✅ Assets request returns 200
   - ✅ No CORS errors
   - ✅ Token is stored in localStorage

---

## Step 6: Test Different Users (Multi-Tenant)

### Test 6: Verify Data Isolation

1. **Login as Acme Corp:**
   - Email: `admin@acme.com`
   - Password: `password123`
   - Add some assets

2. **Logout and login as Globex:**
   - Email: `hank@globex.com`
   - Password: `password123`
   - Should see different assets (or empty if none)

3. **Verify:**
   - ✅ Each organization sees only their data
   - ✅ Organization name changes in dashboard

---

## Quick Test Checklist

### Backend Tests
- [ ] Backend URL is accessible
- [ ] `/api/assets` returns 401 (expected without token)
- [ ] `/api/auth/login` works with test credentials
- [ ] Login returns token and user data
- [ ] `/api/assets` with token returns data (or empty array)
- [ ] No errors in Railway logs

### Frontend Tests (After Vercel Deploy)
- [ ] Frontend loads
- [ ] Login form appears
- [ ] Login works
- [ ] Dashboard loads after login
- [ ] Organization name displays
- [ ] Can add asset
- [ ] Can edit asset
- [ ] Can delete asset
- [ ] No console errors
- [ ] No CORS errors

---

## Common Issues & Solutions

### Issue: CORS Error
**Symptom:** Browser console shows CORS error
**Fix:** Update `backend/src/server.js` CORS settings to include your Vercel URL

### Issue: 401 on All Requests
**Symptom:** Even with token, getting 401
**Fix:** Check JWT_SECRET matches between login and verify

### Issue: Empty Assets Array
**Symptom:** Login works but no assets shown
**Fix:** Run seed data in Supabase (SUPABASE_SEED.sql)

### Issue: Connection Refused
**Symptom:** Can't connect to Railway URL
**Fix:** Check Railway service is running (not sleeping)

---

## Testing Tools

### Online API Testing:
- [Postman](https://www.postman.com/) - Full API testing
- [Thunder Client](https://www.thunderclient.com/) - VS Code extension
- [Insomnia](https://insomnia.rest/) - API client

### Browser Extensions:
- [REST Client](https://chrome.google.com/webstore) - Chrome extension
- Browser DevTools Network tab

---

## Example: Complete Test Script (PowerShell)

```powershell
# Set your Railway URL
$baseUrl = "https://your-railway-app.up.railway.app/api"

# Test 1: Health Check
Write-Host "Test 1: Health Check (should return 401)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/assets" -Method GET -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Backend is running!" -ForegroundColor Green
    }
}

# Test 2: Login
Write-Host "`nTest 2: Login" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@acme.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Cyan
$token = $loginResponse.token

# Test 3: Get Assets
Write-Host "`nTest 3: Get Assets" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

$assets = Invoke-RestMethod -Uri "$baseUrl/assets" `
    -Method GET `
    -Headers $headers

Write-Host "✅ Assets retrieved! Count: $($assets.Count)" -ForegroundColor Green

Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
```

Save this as `test-api.ps1` and run:
```powershell
.\test-api.ps1
```

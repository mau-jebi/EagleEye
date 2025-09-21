# 🔧 EagleEye Deployment Troubleshooting Guide

Common issues and solutions when deploying EagleEye to Vercel + Supabase.

## 🚨 Common Issues

### 1. Build Failures on Vercel

**Error**: `Module not found: Can't resolve '@/lib/supabase'`

**Solution**:
```bash
# Ensure the file exists and TypeScript paths are configured
# Check tsconfig.json includes:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Error**: `Environment variables not found`

**Solution**:
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure variables are set for all environments (Production, Preview, Development)
3. Redeploy after adding variables

### 2. Supabase Connection Issues

**Error**: `Invalid API key`

**Solution**:
1. Go to Supabase Dashboard → Settings → API
2. Copy the correct anon key (not service role key for client)
3. Ensure no extra spaces in environment variables

**Error**: `Row Level Security violation`

**Solution**:
```sql
-- Check if RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'assignments';

-- If missing, re-run the RLS setup from deployment guide
```

### 3. Authentication Issues

**Error**: `User not redirected after login`

**Solution**:
1. Update Supabase Auth settings:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
2. Add auth callback handler

### 4. PWA Installation Issues

**Error**: `Add to Home Screen not appearing`

**Solution**:
1. Verify HTTPS (Vercel provides this automatically)
2. Check manifest.json is accessible at `/manifest.json`
3. Ensure service worker is registered
4. Test on different browsers/devices

### 5. Database Migration Issues

**Error**: `Function create_default_classes_for_user does not exist`

**Solution**:
```sql
-- Re-run the function creation in Supabase SQL Editor
CREATE OR REPLACE FUNCTION create_default_classes_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO classes (name, color, user_id) VALUES
    ('English', '#3B82F6', user_uuid),
    ('History', '#10B981', user_uuid),
    ('Calculus', '#F59E0B', user_uuid),
    ('TOK', '#8B5CF6', user_uuid),
    ('Personal', '#6B7280', user_uuid),
    ('Yearbook', '#EC4899', user_uuid),
    ('Psychology', '#06B6D4', user_uuid),
    ('Biology', '#84CC16', user_uuid),
    ('Spanish', '#F97316', user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔍 Debugging Steps

### Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on latest deployment
3. Check build logs and runtime logs

### Check Supabase Logs
1. Supabase Dashboard → Logs
2. Filter by timestamp of the issue
3. Look for SQL errors or auth issues

### Test Locally
```bash
# Install dependencies
npm install

# Set up local environment
cp .env.example .env.local
# Add your Supabase credentials

# Run locally
npm run dev
```

### Verify Database Schema
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';
```

## 🛠️ Quick Fixes

### Reset Supabase Database
```sql
-- Drop all tables (CAUTION: This deletes all data!)
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP FUNCTION IF EXISTS create_default_classes_for_user CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Re-run the complete schema from DEPLOYMENT.md
```

### Force Vercel Redeploy
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Or push an empty commit:
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

### Clear Vercel Cache
```bash
# Add to package.json scripts
"clean": "rm -rf .next && rm -rf .vercel"

# Or in Vercel dashboard
# Settings → General → Clear Cache
```

## 📋 Verification Checklist

### ✅ Supabase Setup
- [ ] Project created and accessible
- [ ] Database schema deployed
- [ ] RLS policies enabled
- [ ] Default classes function created
- [ ] Auth trigger configured
- [ ] API keys copied correctly

### ✅ Vercel Setup
- [ ] Repository connected
- [ ] Environment variables set
- [ ] Build completed successfully
- [ ] Deployment accessible
- [ ] Custom domain configured (if applicable)

### ✅ Application Features
- [ ] User can sign up/login
- [ ] Default classes appear for new users
- [ ] Assignments can be created/edited/deleted
- [ ] Data persists between sessions
- [ ] PWA installs on mobile
- [ ] Offline functionality works

### ✅ Security
- [ ] Environment variables not exposed in client
- [ ] RLS prevents users from seeing others' data
- [ ] HTTPS enabled
- [ ] Auth redirects work correctly

## 🔄 Migration from localStorage

If you had data in localStorage that you want to migrate:

```typescript
// Migration utility function
const migrateLocalStorageToSupabase = async () => {
  const localClasses = localStorage.getItem('eagleeye-classes')
  const localAssignments = localStorage.getItem('eagleeye-assignments')

  if (localClasses || localAssignments) {
    // Parse and upload to Supabase
    // Implementation depends on your data structure
    console.log('Migration needed - implement based on your needs')
  }
}
```

## 📞 Getting Help

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

### Supabase Support
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

### EagleEye Specific
- Create an issue in the GitHub repository
- Include error logs and steps to reproduce

## 🚀 Performance Tips

### Optimize Build Size
```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

### Database Performance
```sql
-- Add indexes for better query performance
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_due_at ON assignments(due_at);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_classes_user_id ON classes(user_id);
```

### Caching Strategy
```typescript
// Use React Query for better caching
npm install @tanstack/react-query

// Implement in your hooks for better performance
```

This should resolve most common deployment issues!
# 🚀 EagleEye Deployment Guide: Vercel + Supabase

This guide will walk you through deploying the EagleEye Assignment Tracker PWA using Vercel for hosting and Supabase for cloud database storage.

## 📋 Prerequisites

- GitHub account with the EagleEye repository
- Vercel account (free tier available)
- Supabase account (free tier available)
- Node.js 18+ installed locally

## Part 1: 🗄️ Supabase Setup (Backend Database)

### Step 1: Create Supabase Project

1. **Sign up/Login to Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" and sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Fill in project details:
     - **Name**: `eagleeye-tracker`
     - **Database Password**: Generate a secure password (save this!)
     - **Region**: Choose closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

### Step 2: Database Schema Setup

1. **Open SQL Editor**
   - In your Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Create Tables**
   - Copy and paste this schema:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Classes table
CREATE TABLE classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration_min INTEGER DEFAULT 60,
  is_important BOOLEAN DEFAULT FALSE,
  is_urgent BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'almost_done', 'completed', 'overdue')),
  notes TEXT,
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Users can only see their own classes" ON classes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own classes" ON classes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own classes" ON classes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own classes" ON classes
  FOR DELETE USING (auth.uid() = user_id);

-- Assignments policies
CREATE POLICY "Users can only see their own assignments" ON assignments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON assignments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

3. **Run the Query**
   - Click "Run" to execute the schema
   - Verify tables are created in the "Table Editor"

### Step 3: Insert Default Classes

1. **Create Default Classes Function**
   - In SQL Editor, create a new query:

```sql
-- Function to create default classes for new users
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

-- Trigger to create default classes when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_classes_for_user(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 4: Enable Authentication

1. **Configure Auth Settings**
   - Go to "Authentication" → "Settings"
   - Enable "Enable email confirmations" (optional)
   - Add your site URL: `https://your-app-name.vercel.app`

2. **Set up Auth Providers** (Optional)
   - Go to "Authentication" → "Providers"
   - Enable Google, GitHub, or other providers as needed
   - Configure OAuth credentials

### Step 5: Get API Keys

1. **Project Settings**
   - Go to "Settings" → "API"
   - Copy these values (you'll need them later):
     - **Project URL**: `https://xxxxx.supabase.co`
     - **Anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## Part 2: 🔧 Code Integration

### Step 6: Install Supabase Client

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

### Step 7: Environment Variables

1. **Create `.env.local`**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. **Add to `.gitignore`**
```bash
# Environment variables
.env.local
.env
```

### Step 8: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
  public: {
    Tables: {
      classes: {
        Row: {
          id: string
          name: string
          color: string
          is_archived: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          is_archived?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          is_archived?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          class_id: string
          due_at: string
          estimated_duration_min: number
          is_important: boolean
          is_urgent: boolean
          status: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes: string | null
          progress_pct: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          class_id: string
          due_at: string
          estimated_duration_min?: number
          is_important?: boolean
          is_urgent?: boolean
          status?: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes?: string | null
          progress_pct?: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          class_id?: string
          due_at?: string
          estimated_duration_min?: number
          is_important?: boolean
          is_urgent?: boolean
          status?: 'not_started' | 'in_progress' | 'almost_done' | 'completed' | 'overdue'
          notes?: string | null
          progress_pct?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

### Step 9: Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

## Part 3: 🌐 Vercel Deployment

### Step 10: Connect to Vercel

1. **Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `EagleEye` repository
   - Click "Import"

### Step 11: Configure Environment Variables

1. **In Vercel Dashboard**
   - Go to your project settings
   - Click "Environment Variables"
   - Add the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. **Set for all environments**: Production, Preview, Development

### Step 12: Deploy Settings

1. **Build Settings** (usually auto-detected):
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

2. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Step 13: Configure Domain & PWA

1. **Custom Domain** (Optional)
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Configure DNS records

2. **Update Supabase Auth URLs**
   - In Supabase: "Authentication" → "Settings"
   - Update "Site URL" to your Vercel URL
   - Add redirect URLs:
     - `https://your-app.vercel.app`
     - `https://your-app.vercel.app/auth/callback`

## Part 4: 🧪 Testing & Verification

### Step 14: Test Deployment

1. **Basic Functionality**
   - Visit your deployed URL
   - Test PWA installation
   - Verify responsive design

2. **Authentication Flow**
   - Sign up with email
   - Verify email (if enabled)
   - Test login/logout

3. **Database Operations**
   - Create assignments
   - Edit assignments
   - Delete assignments
   - Verify data persists

### Step 15: Monitor & Debug

1. **Vercel Analytics**
   - Enable in project settings
   - Monitor performance and usage

2. **Supabase Monitoring**
   - Check "Reports" for database usage
   - Monitor "Logs" for errors

3. **Error Handling**
   - Check Vercel function logs
   - Review Supabase logs for issues

## Part 5: 🔄 Ongoing Maintenance

### Step 16: Updates & CI/CD

1. **Automatic Deployments**
   - Push to main branch = automatic deploy
   - Preview deployments for PRs

2. **Database Migrations**
   - Use Supabase SQL Editor for schema changes
   - Test in staging environment first

3. **Backup Strategy**
   - Supabase provides automatic backups
   - Consider export scripts for additional backup

### Step 17: Performance Optimization

1. **Vercel Edge Functions** (if needed)
   - Move heavy computations to edge
   - Reduce client-side processing

2. **Database Indexing**
   - Add indexes for frequently queried fields
   - Monitor slow queries in Supabase

3. **Caching Strategy**
   - Use Vercel's built-in caching
   - Implement React Query for client caching

## 🔒 Security Checklist

- ✅ Row Level Security enabled on all tables
- ✅ Environment variables secured
- ✅ HTTPS enabled (Vercel default)
- ✅ Auth policies configured
- ✅ API keys properly scoped
- ✅ No sensitive data in client code

## 📈 Scaling Considerations

1. **Database Limits**
   - Free tier: 500MB database
   - Upgrade to Pro for larger projects

2. **Vercel Limits**
   - Free tier: 100GB bandwidth/month
   - Upgrade for higher traffic

3. **Performance Monitoring**
   - Use Vercel Analytics
   - Monitor Supabase performance metrics

## 🎉 Final Result

Your EagleEye PWA will be:
- ✅ Deployed at `https://your-app.vercel.app`
- ✅ Installable on mobile devices
- ✅ Cloud-synced across devices
- ✅ Scalable and secure
- ✅ Automatically deployed on code changes

**Estimated Total Setup Time**: 30-45 minutes

**Monthly Cost**: $0 (free tiers) for small to medium usage

---

Need help? Check the troubleshooting section below or reach out with specific issues!
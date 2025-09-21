# 🚀 Quick Setup Guide

## Option 1: Manual Setup (Recommended)
Follow the detailed guide in `DEPLOYMENT.md`

## Option 2: Quick Start Checklist

### 1. ✅ Local Development Setup
```bash
# Clone and install
git clone https://github.com/mau-jebi/EagleEye.git
cd EagleEye
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run locally
npm run dev
```

### 2. ✅ Supabase Setup (5 minutes)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy SQL from `DEPLOYMENT.md` → Supabase SQL Editor → Run
3. Go to Settings → API → Copy credentials to `.env.local`
4. Go to Authentication → Settings → Add your domain

### 3. ✅ Vercel Deployment (3 minutes)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Add environment variables from `.env.local`
4. Deploy

### 4. ✅ PWA Testing
1. Visit your deployed URL on mobile
2. Add to Home Screen
3. Test offline functionality
4. Verify data syncing

## 🎯 End Result
- ✅ Live at `https://your-app.vercel.app`
- ✅ Installable PWA on mobile
- ✅ Cloud data sync
- ✅ Offline functionality
- ✅ User authentication

**Total Setup Time**: ~15 minutes

## 🆘 Need Help?
- Check `TROUBLESHOOTING.md` for common issues
- Create an issue on GitHub
- Ensure all environment variables are set correctly

## 📱 Mobile Testing
1. Open on iPhone/Android browser
2. Look for "Add to Home Screen" prompt
3. Install and test offline mode
4. Verify push notifications (future feature)

## 🔐 Security Verified
- ✅ HTTPS enabled (Vercel default)
- ✅ Row Level Security on database
- ✅ Environment variables secured
- ✅ No sensitive data in client code

---

**Ready to keep an eagle eye on your assignments!** 🦅
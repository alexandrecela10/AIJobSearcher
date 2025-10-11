# 🚀 Fly.io Deployment Guide (FREE, No Timeouts)

## Why Fly.io?
- ✅ **FREE tier** ($5/month credit, enough for this app)
- ✅ **No timeout limits** - Auto-process works!
- ✅ **Simple deployment**
- ✅ **PostgreSQL included** (for future features)

---

## 📋 Step-by-Step Deployment (15 minutes)

### **Step 1: Install Fly CLI**

```bash
# On Mac
brew install flyctl

# On Linux/WSL
curl -L https://fly.io/install.sh | sh
```

### **Step 2: Sign Up & Login**

```bash
# Sign up (free, no credit card required initially)
flyctl auth signup

# Or login
flyctl auth login
```

### **Step 3: Launch Your App**

```bash
# In your project directory
cd /Users/alexandrecela/Documents/job_searcher

# Launch (this creates fly.toml config)
flyctl launch
```

**Answer the prompts:**
- App name: `job-searching-robot` (or your choice)
- Region: Choose closest to you (e.g., `lhr` for London)
- PostgreSQL: `No` (we're using JSON files for now)
- Deploy now: `No` (we need to set env vars first)

### **Step 4: Set Environment Variables**

```bash
# Set your OpenAI API key
flyctl secrets set OPENAI_API_KEY="sk-your-key-here"

# Set email credentials
flyctl secrets set SMTP_HOST="smtp.gmail.com"
flyctl secrets set SMTP_PORT="587"
flyctl secrets set SMTP_USER="your-email@gmail.com"
flyctl secrets set SMTP_PASS="your-app-password"
```

### **Step 5: Deploy!**

```bash
flyctl deploy
```

**This will:**
1. Build your Docker image
2. Push to Fly.io
3. Deploy to their infrastructure
4. Give you a URL: `https://job-searching-robot.fly.dev`

### **Step 6: Check Status**

```bash
# View logs
flyctl logs

# Check status
flyctl status

# Open in browser
flyctl open
```

---

## 🎯 Your App is Live!

**URL:** `https://your-app-name.fly.dev`

**Features that work:**
- ✅ Manual steps (all 5 steps)
- ✅ **Auto-process** (no timeout!)
- ✅ File uploads
- ✅ Email sending
- ✅ AI job matching

---

## 💰 Cost Breakdown

**Free tier includes:**
- 3 shared VMs (256MB RAM)
- 3GB persistent storage
- 160GB bandwidth/month

**Your app usage:**
- ~1 VM (256MB) = FREE
- ~500MB storage = FREE
- ~5GB bandwidth/month = FREE

**Total cost: $0/month** (within free tier)

---

## 🔧 Useful Commands

```bash
# View logs in real-time
flyctl logs -a your-app-name

# SSH into your app
flyctl ssh console

# Scale up (if needed later)
flyctl scale vm shared-cpu-1x --memory 512

# Restart app
flyctl apps restart

# Delete app
flyctl apps destroy your-app-name
```

---

## 📊 Monitoring

**View metrics:**
```bash
flyctl dashboard
```

Or visit: https://fly.io/dashboard

---

## 🔄 Update Your App

```bash
# Make changes to your code
git add -A
git commit -m "Update feature"

# Deploy new version
flyctl deploy
```

**Deployment takes ~2-3 minutes**

---

## ⚠️ Troubleshooting

### **Issue: Build fails**
```bash
# Check build logs
flyctl logs

# Try local build first
docker build -t job-searcher .
docker run -p 3000:3000 job-searcher
```

### **Issue: App crashes**
```bash
# Check logs
flyctl logs

# Check status
flyctl status

# Restart
flyctl apps restart
```

### **Issue: Out of memory**
```bash
# Scale up to 512MB (still free tier)
flyctl scale vm shared-cpu-1x --memory 512
```

---

## 🎉 Success!

Your app is now deployed and accessible worldwide!

**Share your URL:** `https://your-app-name.fly.dev`

**Next steps:**
1. Test all features
2. Share with friends
3. Add custom domain (optional)
4. Implement encryption (see PRIVACY_IMPLEMENTATION.md)

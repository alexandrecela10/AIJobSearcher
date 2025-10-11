# ⚡ 20-Minute Deployment Checklist

## ✅ Prerequisites (Already Done!)
- [x] Fly CLI installed
- [x] Dockerfile created
- [x] docker-compose.yml created
- [x] .dockerignore created

---

## 🚀 Deploy to Fly.io (15 minutes)

### **Step 1: Add Fly to PATH**
```bash
export FLYCTL_INSTALL="/Users/alexandrecela/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Verify
flyctl --version
```

---

### **Step 2: Sign Up**
```bash
flyctl auth signup
```
- Sign up with GitHub (fastest)
- No credit card required

---

### **Step 3: Launch Your App**
```bash
cd /Users/alexandrecela/Documents/job_searcher

# Launch (creates fly.toml)
flyctl launch
```

**Answer the prompts:**
- App name: `job-searching-robot` (or your choice)
- Region: Choose closest (e.g., `lhr` for London)
- PostgreSQL: `No` (we're using JSON files for now)
- Deploy now: `No` (we need to set secrets first)

---

### **Step 4: Set Environment Variables (Secrets)**
```bash
# Set your OpenAI API key
flyctl secrets set OPENAI_API_KEY="sk-your-actual-key-here"

# Set email credentials
flyctl secrets set SMTP_HOST="smtp.gmail.com"
flyctl secrets set SMTP_PORT="587"
flyctl secrets set SMTP_USER="your-email@gmail.com"
flyctl secrets set SMTP_PASS="your-app-password"
```

**Important:** Replace with your actual values!

---

### **Step 5: Deploy!**
```bash
flyctl deploy
```

**This will:**
1. Build your Docker image (5-8 minutes)
2. Push to Fly.io
3. Deploy to their infrastructure
4. Give you a URL

**Wait for:** "Deployment successful!"

---

### **Step 6: Get Your URL**
```bash
flyctl status
```

**Your app is live at:** `https://job-searching-robot.fly.dev`

---

### **Step 7: View Logs (Optional)**
```bash
# Real-time logs
flyctl logs

# Open in browser
flyctl open
```

---

## 🎉 Success!

Your app is now deployed and accessible worldwide!

**URL:** `https://your-app-name.fly.dev`

---

## 🔧 Useful Commands

```bash
# View app status
flyctl status

# View logs
flyctl logs

# Restart app
flyctl apps restart

# SSH into app
flyctl ssh console

# Update secrets
flyctl secrets set KEY="value"

# Redeploy
flyctl deploy

# Destroy app
flyctl apps destroy your-app-name
```

---

## ⚠️ Troubleshooting

### **Build fails?**
```bash
# Check logs
flyctl logs

# Try local build first
docker build -t job-searcher .
```

### **App crashes?**
```bash
# Check logs
flyctl logs

# Check status
flyctl status
```

### **Need more memory?**
```bash
# Scale up (still free tier)
flyctl scale vm shared-cpu-1x --memory 512
```

---

## 💰 Cost

**Free tier includes:**
- 3 shared VMs (256MB RAM)
- 3GB persistent storage
- 160GB bandwidth/month

**Your app uses:**
- 1 VM (256MB) = FREE
- ~500MB storage = FREE
- ~5GB bandwidth/month = FREE

**Total: $0/month** (within free tier)

---

## 🔄 Update Your App

```bash
# Make changes to your code
git add -A
git commit -m "Update feature"

# Deploy new version
flyctl deploy
```

---

## 📚 Next Steps

1. **Test your app** - Visit the URL
2. **Share with friends** - Get feedback
3. **Add custom domain** (optional)
4. **Implement encryption** (see PRIVACY_IMPLEMENTATION.md)
5. **Set up CI/CD** (auto-deploy on git push)

---

## 🎯 What You Learned

- ✅ Docker containerization
- ✅ Cloud deployment
- ✅ Environment variable management
- ✅ Production deployment

**Congratulations! You're a DevOps engineer now!** 🎉

# 🚀 Getting Started with JobSearchingRobot

## 👋 Welcome!

This guide will help you get started in **5 minutes**.

---

## 🎯 What Do You Want to Do?

### **Option 1: Deploy Quickly (20 minutes)**

**Best for:** Just want it running

```
1. Read: docs/deployment/RENDER_DEPLOYMENT.md
2. Push to GitHub
3. Deploy to Render
4. Done!
```

**[→ Go to Quick Deploy Guide](./deployment/RENDER_DEPLOYMENT.md)**

---

### **Option 2: Learn Infrastructure (4-6 weeks)**

**Best for:** Data Analyst → Software Engineer transition

```
Week 1: Docker basics
Week 2: Docker Compose
Week 3: Terraform
Week 4: Cloud deployment
Week 5: CI/CD
```

**[→ Go to Learning Path](./INFRASTRUCTURE_QUICKSTART.md)**

---

### **Option 3: Run Locally (10 minutes)**

**Best for:** Development & testing

```bash
# 1. Copy environment variables
cp env.example .env
# Edit .env with your API keys

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev

# 4. Visit http://localhost:3000
```

**[→ Go to Local Setup Guide](./deployment/DEPLOYMENT_GUIDE.md#local-development)**

---

## 📚 Documentation Map

```
START HERE
    ↓
docs/README.md (Index)
    ↓
    ├─→ Quick Deploy? → deployment/RENDER_DEPLOYMENT.md
    ├─→ Learn Docker? → learning/DOCKER_LEARNING_GUIDE.md
    ├─→ Learn Terraform? → learning/TERRAFORM_GUIDE.md
    └─→ Understand app? → guides/JOB_MATCHING_LOGIC.md
```

---

## ⚡ 5-Minute Quick Start

### **Step 1: Choose Your Path (1 minute)**

- **Fast:** Render deployment (no credit card)
- **Learning:** Docker + Terraform
- **Local:** Run on your Mac

### **Step 2: Read the Guide (2 minutes)**

- Open the relevant guide from links above
- Skim the steps
- Gather requirements (API keys, etc.)

### **Step 3: Follow the Steps (varies)**

- Quick deploy: 20 minutes
- Learning path: 4-6 weeks
- Local setup: 10 minutes

### **Step 4: Test Your App (2 minutes)**

- Visit the URL
- Submit a test job search
- Check email for results

---

## 🛠️ Prerequisites

### **For All Paths:**

1. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Cost: ~$0.10 per job search

2. **Email Credentials**
   - Gmail recommended
   - App password: https://myaccount.google.com/apppasswords

### **For Deployment:**

3. **GitHub Account**
   - Free: https://github.com

4. **Render Account** (or other platform)
   - Free: https://render.com
   - No credit card required

### **For Learning Path:**

5. **Docker Desktop**
   - Free: https://www.docker.com/products/docker-desktop

6. **Terraform** (optional)
   - Free: `brew install terraform`

---

## 📖 Key Documents

| Document | Purpose | Time |
|----------|---------|------|
| [README.md](../README.md) | Project overview | 2 min |
| [docs/README.md](./README.md) | Documentation index | 3 min |
| [INFRASTRUCTURE_QUICKSTART.md](./INFRASTRUCTURE_QUICKSTART.md) | Choose your path | 5 min |
| [RENDER_DEPLOYMENT.md](./deployment/RENDER_DEPLOYMENT.md) | Quick deploy | 20 min |
| [DOCKER_LEARNING_GUIDE.md](./learning/DOCKER_LEARNING_GUIDE.md) | Learn Docker | 8-10 hrs |

---

## 🎓 Learning Recommendations

### **If You're a Data Analyst:**

**Goal:** Transition to Software Engineer

**Path:** Learning Path (Option 2)

**Why?**
- Learn production-grade skills
- Docker & Terraform are industry standard
- Highly valuable for career growth

**Time:** 4-6 weeks (2-3 hours/week)

---

### **If You Just Want It Working:**

**Goal:** Deploy and use the app

**Path:** Quick Deploy (Option 1)

**Why?**
- Fastest way to get running
- No infrastructure knowledge needed
- Can learn later

**Time:** 20 minutes

---

### **If You're Exploring:**

**Goal:** Understand how it works

**Path:** Local Setup (Option 3)

**Why?**
- See the code in action
- Experiment safely
- No cloud account needed

**Time:** 10 minutes

---

## 🚦 Decision Tree

```
Do you want to learn infrastructure?
    ├─ YES → Learning Path (Docker + Terraform)
    │         Time: 4-6 weeks
    │         Outcome: Production-grade skills
    │
    └─ NO → Quick Deploy (Render)
              Time: 20 minutes
              Outcome: Working app

Do you have a credit card?
    ├─ YES → Fly.io (15 min) or Render (20 min)
    └─ NO → Render (20 min) or Oracle Cloud (60 min)

Do you want to run locally first?
    ├─ YES → Local Setup (10 min)
    └─ NO → Deploy directly
```

---

## 💡 Pro Tips

### **Tip 1: Start Small**

Don't try to learn everything at once:
1. Get it running locally first
2. Then deploy
3. Then learn Docker
4. Then learn Terraform

### **Tip 2: Follow One Path**

Pick ONE path and complete it:
- ✅ Complete Quick Deploy OR Learning Path
- ❌ Don't jump between paths

### **Tip 3: Document Your Journey**

Keep notes:
- What worked
- What didn't
- Questions you have

### **Tip 4: Use the Guides**

The guides are comprehensive:
- Don't skip steps
- Read the explanations
- Try the examples

---

## 🆘 Common Questions

### **Q: Which deployment option is best?**

**A:** Depends on your goal:
- **Fastest:** Render (20 min, no credit card)
- **Most learning:** Oracle Cloud (60 min, full control)
- **Best balance:** Fly.io (15 min, but requires credit card)

### **Q: Do I need to learn Docker?**

**A:** Not required, but highly recommended:
- **For quick deploy:** No, use Render
- **For career growth:** Yes, learn Docker

### **Q: How much does it cost?**

**A:** Can be completely free:
- Render: FREE tier
- Oracle Cloud: FREE forever
- OpenAI API: ~$0.10 per search

### **Q: How long to learn everything?**

**A:** 4-6 weeks (2-3 hours/week):
- Week 1-2: Docker
- Week 3: Terraform
- Week 4: Deployment
- Week 5: CI/CD

### **Q: Can I deploy without GitHub?**

**A:** Yes, but not recommended:
- Local Docker: No GitHub needed
- Cloud platforms: GitHub makes it easier

---

## 🎯 Next Steps

### **Right Now (5 minutes):**

1. **Choose your path** (Quick Deploy or Learning)
2. **Open the relevant guide**
3. **Gather prerequisites** (API keys, accounts)

### **Today (20-60 minutes):**

1. **Follow the guide** step-by-step
2. **Deploy or set up locally**
3. **Test the app**

### **This Week:**

1. **Use the app** for real job searches
2. **Share with friends**
3. **Get feedback**

### **This Month:**

1. **Start learning path** (if you chose Quick Deploy)
2. **Implement encryption** (see PRIVACY_IMPLEMENTATION.md)
3. **Add custom features**

---

## 📚 Additional Resources

### **Documentation:**
- [Full Documentation Index](./README.md)
- [Directory Structure](./DIRECTORY_STRUCTURE.md)
- [Infrastructure Quickstart](./INFRASTRUCTURE_QUICKSTART.md)

### **Guides:**
- [Job Matching Logic](./guides/JOB_MATCHING_LOGIC.md)
- [Automated Service](./guides/AUTOMATED_SERVICE_GUIDE.md)

### **Learning:**
- [Docker Guide](./learning/DOCKER_LEARNING_GUIDE.md)
- [Terraform Guide](./learning/TERRAFORM_GUIDE.md)
- [JavaScript Basics](./learning/JAVASCRIPT_BASICS.md)

---

## 🎉 You're Ready!

Pick your path and start now:

- **[⚡ Quick Deploy →](./deployment/RENDER_DEPLOYMENT.md)**
- **[🎓 Learning Path →](./INFRASTRUCTURE_QUICKSTART.md)**
- **[💻 Local Setup →](./deployment/DEPLOYMENT_GUIDE.md)**

**Good luck!** 🚀

# 🤖 JobSearchingRobot

An AI-powered job search automation tool that finds, matches, and customizes applications for you.

**Built with:** Next.js 14, TypeScript, OpenAI, Playwright

## Tech

- Next.js 14 (App Router)
- React 18
- Tailwind CSS + @tailwindcss/forms
- TypeScript

## What’s implemented

- Sleek dark UI in `app/page.tsx` using Tailwind.
- Form fields: `companies`, `roles`, `seniority`, `cities`, `visa`.
- CSV upload field `template` with 2MB limit and basic content checks.
- API route `app/api/submit/route.ts` to accept multipart form, validate, and store locally.
- Local persistence under `data/submissions.json` and CSV files saved to `uploads/`.
- Security headers via `next.config.mjs` and basic server-side validation.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000

## Data storage

- Submissions are appended to `data/submissions.json`.
- CSV files are saved to `uploads/<id>.csv`.
- Both locations are ignored by Git (`.gitignore`).

---

## 📚 Documentation

**All documentation is in the [`docs/`](./docs/) folder:**

- **[📖 Documentation Index](./docs/README.md)** - Start here!
- **[⚡ Quick Start](./docs/INFRASTRUCTURE_QUICKSTART.md)** - Choose your deployment path

### **Quick Links:**

| What do you want to do? | Guide |
|-------------------------|-------|
| **Deploy quickly (20 min)** | [`docs/deployment/RENDER_DEPLOYMENT.md`](./docs/deployment/RENDER_DEPLOYMENT.md) |
| **Learn Docker & infrastructure** | [`docs/learning/DOCKER_LEARNING_GUIDE.md`](./docs/learning/DOCKER_LEARNING_GUIDE.md) |
| **Learn Terraform** | [`docs/learning/TERRAFORM_GUIDE.md`](./docs/learning/TERRAFORM_GUIDE.md) |
| **Understand job matching** | [`docs/guides/JOB_MATCHING_LOGIC.md`](./docs/guides/JOB_MATCHING_LOGIC.md) |
| **Implement encryption** | [`docs/deployment/PRIVACY_IMPLEMENTATION.md`](./docs/deployment/PRIVACY_IMPLEMENTATION.md) |

---

## 🚀 Quick Deploy (20 minutes)

### **Option 1: Render (No Credit Card Required)**

```bash
# 1. Push to GitHub
git init
git add -A
git commit -m "Initial commit"
git push origin main

# 2. Go to https://render.com
# 3. Sign up with GitHub
# 4. New Web Service → Connect repo
# 5. Add environment variables
# 6. Deploy!
```

**Full guide:** [`docs/deployment/RENDER_DEPLOYMENT.md`](./docs/deployment/RENDER_DEPLOYMENT.md)

---

### **Option 2: Local Docker**

```bash
# 1. Copy environment variables
cp env.example .env
# Edit .env with your API keys

# 2. Run with Docker Compose
docker-compose up -d

# 3. Visit http://localhost:3000
```

**Full guide:** [`docs/learning/DOCKER_LEARNING_GUIDE.md`](./docs/learning/DOCKER_LEARNING_GUIDE.md)

---

## 🎓 Learning Path

Want to learn infrastructure? Follow this path:

```
Week 1: Docker basics (2-3 hours)
   ↓
Week 2: Docker Compose (1-2 hours)
   ↓
Week 3: Terraform (2-3 hours)
   ↓
Week 4: Cloud deployment (2-3 hours)
   ↓
Week 5: CI/CD automation (1-2 hours)
```

**Start:** [`docs/INFRASTRUCTURE_QUICKSTART.md`](./docs/INFRASTRUCTURE_QUICKSTART.md)

---

## 🛠️ Environment Variables

Create a `.env` file with:

```bash
OPENAI_API_KEY=sk-your-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

See [`env.example`](./env.example) for template.

---

## 📖 Features

- ✅ AI-powered job matching (OpenAI)
- ✅ Automated web scraping (Playwright)
- ✅ Smart search box detection
- ✅ Role expansion (finds similar roles)
- ✅ Email notifications
- ✅ Manual & automated modes
- ✅ Docker containerization
- ✅ Production-ready deployment

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📝 License

MIT

---

## 🎉 Next Steps

1. **Read the docs:** [`docs/README.md`](./docs/README.md)
2. **Choose deployment:** Quick (Render) or Learning (Docker + Terraform)
3. **Deploy your app**
4. **Share with friends**

**Happy job hunting!** 🚀

# 🤖 AI Job Searcher

## Context: 
This is me speaking. Gemini will speak in below sections. I am tinkering with vibe coding for fun and also to improve and develop good propotype software engineering skils. My aim is, whenever I have an idea for a new solution solving a client's problem, I can test it out in the market fast, and get out of 'in theory' land. To deploy demonstrated value, and fast

This software is also going to the first out of a 'AI for my girlfriend' series where I build AI that makes my princess life easier, and will maybe make her realise that Data and AI are not that boring

## Value Proposition
> **Automate your job search:** AI-powered tool that finds matching jobs across multiple companies, analyzes your CV, extracts job requirements, and customizes your application—all while you sleep.

**Pain Points Solved:**
- ❌ Manually searching dozens of company career pages
- ❌ Applying with generic CVs that don't match job requirements
- ❌ Missing jobs because you don't know seniority level or visa requirements
- ❌ Spending hours customizing CVs for each application

**Built with:** Next.js 14, TypeScript, OpenAI GPT-4, Playwright, PostgreSQL

---

## 📸 Screenshot

<img width="1496" height="1754" alt="image" src="https://github.com/user-attachments/assets/1bcabfaf-969d-4702-9fe9-d401b005fea1" />


---

## 🚀 Try It Now

**Live Demo:** https://job-searcher.fly.dev/

1. Enter target companies (e.g., "Stripe, Revolut, Deliveroo")
2. Specify roles (e.g., "Data Engineer, Data Scientist")
3. Choose cities (e.g., "London, Dubai")
4. Upload your CV
5. Click "🚀 Auto-Process & Email"
6. Receive detailed email with:
   - ✅ Matching jobs in your cities
   - ✅ CV issues and improvement recommendations
   - ✅ Seniority level and visa requirements
   - ✅ Customized CV for each job

---

## 🏗️ How It Works: Step-by-Step Implementation

### **Step 1: User Submits Search Criteria**
```typescript
// app/api/submit/route.ts
1. User fills form (companies, roles, cities, CV)
2. Validate input and file upload (max 2MB)
3. Generate unique submission ID
4. Save to PostgreSQL database
5. Save CV file to uploads/
6. Trigger auto-process or return manual steps
```

### **Step 2: Expand Companies with AI**
```typescript
// app/api/process-jobs/route.ts - expandCompanies()
1. Take user's company list (e.g., "Stripe, Google")
2. Ask OpenAI to suggest 8 similar companies
3. Return expanded list (10 companies total)
   Example: "Stripe" → adds "Revolut, Wise, Monzo..."
```

### **Step 3: Find Careers URLs**
```typescript
// app/api/process-jobs/route.ts - findCareersUrls()
1. For each company, ask OpenAI for careers page URL
2. OpenAI returns: {"url": "https://...", "confidence": "high"}
3. Build list of companies + their careers URLs
```

### **Step 4: Scrape Jobs with Playwright**
```typescript
// app/api/process-jobs/route.ts - scrapeJobsAndCustomizeCVs()
For each company (limit 5 for speed):
  1. Launch headless browser
  2. Visit careers URL
  3. Try to find search box → fill with role name
  4. Extract job links from page (filter out blogs, news, etc.)
  5. If no job links found → skip company immediately
  6. For each job link (limit 3 per company):
     a. Visit job page
     b. Extract: title, location, description
     c. Check if role matches (title or body text)
     d. Check if city matches (location or body text)
     e. If both match → proceed to CV analysis
```

### **Step 5: AI-Powered CV Analysis**
```typescript
// app/api/process-jobs/route.ts - customizeCv()
1. Send to OpenAI GPT-4:
   - Job title and description
   - Your CV content
   
2. AI returns structured JSON:
   {
     "cvIssues": ["Missing metrics", "No cloud experience"],
     "recommendations": ["Add quantifiable results", "Highlight AWS"],
     "seniorityInfo": "Senior (5-7 years experience)",
     "visaInfo": "Visa sponsorship available",
     "customizedCv": "Improved CV text...",
     "changes": ["Added data pipeline metrics", "Emphasized AWS"]
   }
```

### **Step 6: Send Email with Results**
```typescript
// app/api/send-email/route.ts
1. Group jobs by company
2. Generate HTML email with:
   - Job title, location, URL
   - 📊 Job Requirements (seniority, visa)
   - ⚠️ CV Issues
   - 💡 Recommendations
   - ✨ Customized CV
3. Send via Nodemailer (SMTP)
```

---

## 🛠️ Run It Yourself

### **Prerequisites**
- Node.js 18+
- OpenAI API key
- SMTP credentials (Gmail, SendGrid, etc.)
- PostgreSQL database (or use Fly.io)

### **Local Development**

1. **Clone the repository**
   ```bash
   git clone https://github.com/alexandrecela10/AIJobSearcher.git
   cd AIJobSearcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   DATABASE_URL=postgresql://user:pass@localhost:5432/jobsearcher
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Set up PostgreSQL**
   ```bash
   # Option 1: Local PostgreSQL
   createdb jobsearcher
   npm run migrate
   
   # Option 2: Use Fly.io (see deployment section)
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

### **Deploy to Fly.io (Production)**

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create PostgreSQL database**
   ```bash
   flyctl postgres create --name job-searcher-db --region lhr
   ```

3. **Deploy app**
   ```bash
   flyctl launch
   flyctl secrets set OPENAI_API_KEY=sk-your-key
   flyctl secrets set SMTP_HOST=smtp.gmail.com
   flyctl secrets set SMTP_USER=your-email@gmail.com
   flyctl secrets set SMTP_PASS=your-password
   flyctl deploy
   ```

4. **Run migration**
   ```bash
   curl -X POST https://your-app.fly.dev/api/migrate
   ```

**Full deployment guide:** See `POSTGRESQL_MIGRATION.md`

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

## ⚠️ Remaining Challenges

### **1. Location Detection Accuracy**
- **Issue:** Some job pages don't have structured location elements
- **Current Solution:** Fallback to searching body text for city names
- **Improvement Needed:** Better location extraction using multiple selectors and AI parsing

### **2. Career Page Variations**
- **Issue:** Each company has different career page structures (Greenhouse, Lever, Workday, custom)
- **Current Solution:** Generic link extraction with filters
- **Improvement Needed:** Template system for popular ATS platforms

### **3. Rate Limiting & Timeouts**
- **Issue:** Some career pages are slow or have anti-bot protection
- **Current Solution:** 60-second timeout per company, skip if no jobs found
- **Improvement Needed:** Retry logic, proxy rotation, better timeout handling

### **4. CV Analysis Quality**
- **Issue:** AI sometimes gives generic recommendations
- **Current Solution:** Structured prompts with examples
- **Improvement Needed:** Fine-tuned model on job descriptions + CV pairs

### **5. Scalability**
- **Issue:** Processing 10 companies takes 3-5 minutes
- **Current Solution:** Limit to 5 companies, 3 jobs per company
- **Improvement Needed:** Queue system (Bull/Redis), parallel processing, caching

---

## 🚀 Next Steps & Roadmap

### **Phase 1: Improve Accuracy** (Current Focus)
- [ ] Better location extraction (multiple selectors + AI)
- [ ] Handle more ATS platforms (Greenhouse, Lever, Workday)
- [ ] Improve city matching (handle "Greater London", "NYC" vs "New York")
- [ ] Add job description quality check

### **Phase 2: Scale & Performance**
- [ ] Implement job queue (Bull + Redis)
- [ ] Add caching for careers URLs (24-hour TTL)
- [ ] Parallel company processing
- [ ] Background job processing
- [ ] Progress updates via WebSocket

### **Phase 3: Enhanced Features**
- [ ] Save search history in database
- [ ] Weekly email digests for recurring searches
- [ ] Job application tracking
- [ ] Interview preparation tips
- [ ] Salary insights from job descriptions

### **Phase 4: User Experience**
- [ ] Dashboard to view past submissions
- [ ] Job bookmarking and notes
- [ ] Browser extension for one-click applications
- [ ] Mobile app (React Native)
- [ ] Chrome extension to auto-fill applications

### **Phase 5: Advanced AI**
- [ ] Fine-tune model on job descriptions
- [ ] Generate cover letters
- [ ] Interview question preparation
- [ ] Skill gap analysis
- [ ] Career path recommendations

---

## 🎉 Get Started

1. **Try the live demo:** https://job-searcher.fly.dev/
2. **Clone and run locally:** See "Run It Yourself" section above
3. **Read the docs:** Check out `POSTGRESQL_MIGRATION.md` and `IMPROVEMENTS_V2.md`
4. **Contribute:** Fork the repo and submit PRs!

**Happy job hunting!** 🚀

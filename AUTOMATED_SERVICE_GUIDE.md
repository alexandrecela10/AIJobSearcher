# 🚀 Automated Job Search Service

## Overview

The Job Searcher now offers **two modes**:

1. **Manual Mode** - Step-by-step process (Steps 1-5)
2. **Automated Mode** - One-click service that does everything in the background

---

## 🎯 How It Works

### **Manual Mode** (Original)
```
Step 1: Submit Criteria
  ↓
Step 2: Review Expanded Companies
  ↓
Step 3: Review Careers URLs
  ↓
Step 4: Review Job Matches
  ↓
Step 5: Send Email
```

### **Automated Mode** (New!)
```
Step 1: Submit Criteria + Click "Auto-Process"
  ↓
[Background Processing]
  - Expand companies with AI
  - Find careers URLs
  - Scrape job listings
  - Customize CVs
  - Send email
  ↓
✅ Email arrives in your inbox!
```

---

## 📋 User Flow

### Step 1: Submit Your Criteria

Fill out the form with:
- **Target Companies**: e.g., "Stripe, Revolut, Monzo"
- **Target Roles**: e.g., "Data Engineer, Analytics Engineer"
- **Seniority**: Junior, Mid, Senior, Lead, Director
- **Target Cities**: e.g., "London, Paris, Remote"
- **Your Email**: Where to send results
- **Update Frequency**: 
  - **Just Once** - Run once, no recurring updates
  - **Daily** - Search for new jobs every day
  - **Weekly** - Search for new jobs every week
- **Visa Sponsorship**: Yes/No
- **Template Resume**: Upload your CV

### Step 2: Choose Your Mode

Two buttons appear:

#### **"Manual Steps →"** Button
- Saves your submission
- Takes you to Step 2
- You manually review each step
- Full control over the process

#### **"🚀 Auto-Process & Email"** Button
- Saves your submission
- Runs everything in the background
- You receive an email when complete
- No manual intervention needed

---

## 🤖 What Happens in Automated Mode

### 1. **Save Submission** (Instant)
```
✅ Your criteria is saved
✅ Your CV is uploaded
✅ Background processing starts
```

### 2. **Expand Companies** (30 seconds)
```
🤖 AI suggests 10 similar companies
Example:
  Input: "Stripe, Revolut"
  Output: "Stripe, Revolut, Monzo, Wise, Checkout.com, ..."
```

### 3. **Find Careers URLs** (1-2 minutes)
```
🔍 AI finds careers pages for each company
Example:
  Stripe → https://stripe.com/jobs
  Revolut → https://www.revolut.com/careers
```

### 4. **Scrape Jobs** (2-3 minutes)
```
🕷️  Browser visits each careers page
📊 Extracts job listings
🎯 Matches against your criteria
✨ Customizes CV for each match
```

### 5. **Send Email** (Instant)
```
📧 Beautiful email with:
  - All matched jobs
  - Customized CVs
  - Direct apply links
```

**Total Time: ~3-5 minutes**

---

## 📧 Email You Receive

```
Subject: Your Job Search Results - 8 Matches Found

🎯 Your Job Search Results
=========================

We found 8 matching jobs for you!

📋 Your Search Criteria
-----------------------
Target Roles: Data Engineer, Analytics Engineer
Seniority: Senior
Cities: London, Remote
Visa: Required

💼 Your Job Matches
-------------------

Stripe
======
📌 Senior Data Engineer
📍 London
🔗 [View Job →]

✨ CUSTOMIZED CV FOR THIS ROLE:
[Full CV tailored to this specific job]

Key Changes:
• Emphasized data pipeline experience
• Added London location preference
• Highlighted Python and SQL skills

---

Revolut
=======
📌 Analytics Platform Engineer
📍 Remote
🔗 [View Job →]

✨ CUSTOMIZED CV FOR THIS ROLE:
[Full CV tailored to this specific job]

Key Changes:
• Focused on analytics infrastructure
• Mentioned remote work experience
• Highlighted relevant technologies
```

---

## 🔄 Update Frequency

### **Just Once**
- Runs immediately after submission
- No recurring updates
- One-time job search

### **Daily** (Future Feature)
- Runs every day at the same time
- Sends email only if new jobs found
- Keeps you updated with fresh opportunities

### **Weekly** (Future Feature)
- Runs every week on the same day
- Sends email only if new jobs found
- Less frequent, but still automated

**Note:** Daily and Weekly scheduling requires a cron job or task scheduler (not yet implemented).

---

## 🛠️ Technical Implementation

### API Endpoint: `/api/process-jobs`

**Purpose**: Orchestrate the entire automated workflow

**Flow**:
```typescript
1. Load submission data
2. Expand companies (AI)
3. Find careers URLs (AI)
4. Launch browser
5. For each company:
   - Visit careers page
   - Extract job links
   - For each job:
     - Visit job page
     - Extract details
     - Match against criteria
     - Customize CV (AI)
6. Close browser
7. Send email with results
```

**Key Features**:
- Runs in background (non-blocking)
- 5-minute timeout protection
- Error handling for each step
- Logs progress to console

---

## 🎨 UI Changes

### Step 1 Form

**Before:**
```
[Save & Continue] button
```

**After:**
```
[Manual Steps →]  [🚀 Auto-Process & Email]
```

### New Fields:
- **Email** - Required for automated mode
- **Update Frequency** - Choose how often to run

---

## 🔍 Comparison: Manual vs Automated

| Feature | Manual Mode | Automated Mode |
|---------|-------------|----------------|
| **Control** | Full control at each step | Hands-off |
| **Time** | ~10-15 minutes (with reviews) | ~3-5 minutes (background) |
| **Interaction** | Review each step | Just submit and wait |
| **Best For** | First-time users, debugging | Regular users, quick searches |
| **Steps Visible** | All 5 steps | Only Step 1 |
| **Email** | Manual send in Step 5 | Automatic |

---

## 💡 Use Cases

### **Use Automated Mode When:**
- ✅ You trust the AI to find relevant jobs
- ✅ You want results quickly
- ✅ You don't need to review each step
- ✅ You're running recurring searches

### **Use Manual Mode When:**
- ✅ First time using the app
- ✅ Want to see what companies are suggested
- ✅ Want to verify careers URLs
- ✅ Want to review job matches before emailing
- ✅ Debugging or testing

---

## 🧪 Testing Automated Mode

### 1. **Start Dev Server**
```bash
npm run dev
```

### 2. **Submit Form**
- Fill out all fields
- Click "🚀 Auto-Process & Email"

### 3. **Watch Terminal**
You'll see:
```
🚀 Starting automated job processing for submission: abc-123

🤖 STEP 2: Expanding companies...
✅ Expanded to 12 companies

🔍 STEP 3: Finding careers URLs...
✅ Found 10 careers URLs

🕷️  STEP 4: Scraping jobs and customizing CVs...
  Processing Stripe...
  Processing Revolut...
✅ Found 3 companies with matches

📧 STEP 5: Sending email to your.email@example.com...
✅ Email sent successfully!

🎉 Automated processing complete
```

### 4. **Check Email**
In development, email is logged to console:
```
📧 ===== EMAIL PREVIEW =====
To: your.email@example.com
Subject: Your Job Search Results - 8 Matches Found
[Full email content]
===== END EMAIL =====
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-...

# Email Configuration (Optional for dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-password

# Base URL (Optional)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🚧 Limitations

### Current Limitations:

1. **Processing Time**: 3-5 minutes (can't be instant due to web scraping)
2. **Company Limit**: Processes max 5 companies in automated mode (to keep it fast)
3. **Jobs Per Company**: Max 2 jobs per company
4. **No Real-Time Updates**: User doesn't see progress (runs in background)
5. **Scheduling Not Implemented**: Daily/Weekly options save preference but don't auto-run

### Future Improvements:

1. **Progress Bar**: Show real-time progress
2. **WebSocket Updates**: Live updates in the UI
3. **Cron Jobs**: Implement daily/weekly scheduling
4. **More Companies**: Process more companies (10-15)
5. **Parallel Processing**: Scrape multiple companies at once
6. **Job Queue**: Use a proper job queue (Bull, BullMQ)
7. **Retry Logic**: Retry failed companies
8. **Email Notifications**: Send email when processing starts/completes

---

## 📊 Performance

### Automated Mode Benchmarks:

```
Step 2 (Expand Companies):     ~30 seconds
Step 3 (Find Careers URLs):    ~1-2 minutes
Step 4 (Scrape Jobs):          ~2-3 minutes
Step 5 (Send Email):           ~1 second

Total: ~3-5 minutes
```

### Factors Affecting Speed:

- Number of companies
- Website loading times
- AI response times
- Network speed

---

## 🔐 Security Considerations

### Data Privacy:

- ✅ CVs stored locally on server
- ✅ No data sent to third parties (except OpenAI for AI features)
- ✅ Email only sent to user's provided address
- ✅ Submissions stored in local JSON file

### API Keys:

- ✅ OpenAI API key in environment variables
- ✅ Never exposed to frontend
- ✅ Not committed to git

---

## 📝 Summary

### **What You Built:**

1. ✅ **Frequency Selector** - Choose update frequency
2. ✅ **Two-Mode System** - Manual or Automated
3. ✅ **Background Processing API** - Combines Steps 2-4
4. ✅ **Automated Email** - Results sent automatically
5. ✅ **Preserved Manual Mode** - All original steps still work

### **User Experience:**

**Before:**
```
User submits → Step 2 → Step 3 → Step 4 → Step 5 → Email
(10-15 minutes of clicking)
```

**After (Automated):**
```
User submits → Wait 3-5 minutes → Email arrives
(Zero clicks after submission!)
```

### **Next Steps:**

1. Test automated mode
2. Implement cron jobs for daily/weekly scheduling
3. Add progress indicators
4. Optimize performance
5. Deploy to production

---

🎉 **You now have a fully automated job search service!**

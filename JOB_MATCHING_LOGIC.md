# 🎯 Job Matching Logic

## Overview

This document explains how the job searcher finds and matches jobs to your criteria.

---

## 🔄 The Complete Flow

```
Step 1: User submits criteria
  ↓
Step 2: AI expands roles
  ↓
Step 3: Find careers URLs
  ↓
Step 4: Scrape & Match Jobs
  ├─ Visit careers page
  ├─ Extract job listing URLs
  ├─ Visit each job page
  ├─ Hard keyword match
  └─ Customize CV
  ↓
Step 5: Email results
```

---

## 📊 Step-by-Step Breakdown

### **Step 1: AI Role Expansion**

**Purpose:** Expand your target roles to catch similar positions

**Example:**
```
Input: "Data Engineer"

AI Generates:
- Data Engineer
- Analytics Engineer
- ML Engineer
- Platform Engineer
- Data Platform Engineer
```

**Why:** Job titles vary across companies. "Data Engineer" at one company might be "Analytics Engineer" at another.

**Implementation:**
```typescript
const roleExpansionPrompt = `Generate 3 similar role titles for: ${criteria.roles.join(", ")}`;
const expandedRoles = [...originalRoles, ...aiGeneratedRoles];
```

---

### **Step 2: Visit Careers Page**

**Purpose:** Access the company's careers/jobs page

**What Happens:**
1. Launch headless browser (Playwright)
2. Navigate to careers URL
3. Wait for page to load
4. Extract all links from the page

**Example:**
```
Visit: https://deliveroo.com/careers
Extract: All <a> tags on the page
```

---

### **Step 3: Filter Job Listing URLs**

**Purpose:** Identify which links are actual job postings (not blogs, news, etc.)

**Filtering Logic:**
```typescript
const jobLinks = links.filter(link => {
  const url = link.href.toLowerCase();
  const text = link.innerText.toLowerCase();
  
  // ❌ EXCLUDE: Blog posts, news, stories
  if (url.includes('/blog') || 
      url.includes('/news') || 
      text.includes('blog')) {
    return false;
  }
  
  // ✅ INCLUDE: Job-related URLs
  const hasJobInUrl = url.includes('/job/') || 
                      url.includes('/role/') || 
                      url.includes('/position/');
  
  const hasJobInText = text.length > 10 && text.length < 200;
  
  return (hasJobInUrl || hasJobInText) && link.href.startsWith('http');
});
```

**Example Results:**
```
✅ https://deliveroo.com/careers/role/data-engineer
✅ https://deliveroo.com/careers/role/senior-data-engineer
❌ https://deliveroo.com/blog/meet-our-team
❌ https://deliveroo.com/news/company-update
```

---

### **Step 4: Visit Each Job Page**

**Purpose:** Extract job details (title, description)

**What Happens:**
1. Open job URL in browser
2. Extract job title (usually in `<h1>`)
3. Extract job description (body text)
4. Close page

**Example:**
```typescript
await page.goto('https://deliveroo.com/careers/role/data-engineer');

const jobDetails = {
  title: "Data Engineer",
  bodyText: "We are looking for a Data Engineer to join our team..."
};
```

---

### **Step 5: Hard Keyword Matching**

**Purpose:** Determine if the job matches your criteria using keyword matching

**Matching Rules:**

#### **1. Role Matching (REQUIRED)**
```typescript
const roleMatch = expandedRoles.some(role => {
  const roleLower = role.toLowerCase();
  
  // Priority 1: Role in title
  if (titleLower.includes(roleLower)) {
    return true; // ✅ MATCH
  }
  
  // Priority 2: Role appears 2+ times in description
  const roleCount = (bodyLower.match(new RegExp(roleLower, 'g')) || []).length;
  if (roleCount >= 2) {
    return true; // ✅ MATCH
  }
  
  return false; // ❌ NO MATCH
});
```

**Examples:**
```
Job Title: "Data Engineer"
Expanded Roles: ["Data Engineer", "Analytics Engineer"]
Result: ✅ MATCH (exact match in title)

Job Title: "Senior Platform Engineer"
Expanded Roles: ["Data Engineer", "Analytics Engineer"]
Body: "...data engineer...data engineer...data engineer..."
Result: ✅ MATCH (appears 3 times in body)

Job Title: "Software Engineer"
Expanded Roles: ["Data Engineer", "Analytics Engineer"]
Body: "...full stack development..."
Result: ❌ NO MATCH (not in title, not 2+ in body)
```

#### **2. City Matching (OPTIONAL)**
```typescript
const cityMatch = criteria.cities.length === 0 || 
  criteria.cities.some(city => 
    bodyLower.includes(city.toLowerCase()) || 
    titleLower.includes(city.toLowerCase())
  );
```

**Examples:**
```
Criteria: ["London", "Paris"]
Job: "...based in London..."
Result: ✅ MATCH

Criteria: ["London", "Paris"]
Job: "...remote position..."
Result: ❌ NO MATCH (but we're flexible on this)
```

#### **3. Seniority Matching (OPTIONAL)**
```typescript
const seniorityMatch = !criteria.seniority || 
  criteria.seniority === "" ||
  titleLower.includes(criteria.seniority.toLowerCase()) ||
  bodyLower.includes(criteria.seniority.toLowerCase());
```

**Examples:**
```
Criteria: "Senior"
Job Title: "Senior Data Engineer"
Result: ✅ MATCH

Criteria: "Junior"
Job Title: "Data Engineer" (no seniority mentioned)
Result: ✅ MATCH (we're flexible)
```

#### **4. Exclude Non-Jobs (REQUIRED)**
```typescript
const isNotJob = (
  titleLower.includes('meet') ||
  titleLower.includes('blog') ||
  titleLower.includes('story') ||
  titleLower.includes('interview') ||
  link.href.includes('/blog')
);
```

**Examples:**
```
Title: "Meet our Data Team"
Result: ❌ EXCLUDED (not a job)

Title: "A Day in the Life of a Data Engineer"
Result: ❌ EXCLUDED (story, not a job)

Title: "Data Engineer"
Result: ✅ NOT EXCLUDED (actual job)
```

---

### **Step 6: Final Match Decision**

**A job is matched if:**
```typescript
if (roleMatch && cityMatch && seniorityMatch && !isNotJob) {
  // ✅ MATCH - Add to results
  matchedJobs.push(job);
}
```

**All conditions must be true:**
- ✅ Role matches (in title OR 2+ in body)
- ✅ City matches (or no city requirement)
- ✅ Seniority matches (or no seniority requirement)
- ✅ Not a blog/story/non-job page

---

## 🎨 CV Customization

**After matching, customize CV for each job:**

```typescript
const cvPrompt = `Customize this CV for the job.

Job: ${jobDetails.title} at ${company}
Description: ${jobDetails.bodyText}

Original CV: ${templateCv}

Return JSON:
{
  "customizedCv": "Full customized CV",
  "changes": ["change 1", "change 2", "change 3"]
}`;
```

---

## 📧 Email Verification Proof

**In the email, we include:**

```
✅ Verified: We visited their careers page and found 2 matching jobs
🔗 View Careers Page → https://deliveroo.com/careers
```

**This proves:**
- We actually visited the website
- We found real job listings
- The jobs are currently available

---

## 🔍 Example: Complete Flow

**User Input:**
```
Roles: Data Engineer
Seniority: Junior
Cities: London, Dubai
```

**Step 1: AI Expansion**
```
Expanded Roles:
- Data Engineer
- Analytics Engineer
- Junior Data Engineer
- Data Platform Engineer
```

**Step 2: Visit Deliveroo Careers**
```
URL: https://deliveroo.com/careers
Found 50 links on page
```

**Step 3: Filter Job URLs**
```
✅ https://deliveroo.com/careers/role/data-engineer
✅ https://deliveroo.com/careers/role/senior-data-engineer
❌ https://deliveroo.com/blog/meet-our-team (excluded: blog)
❌ https://deliveroo.com/news/update (excluded: news)
```

**Step 4: Visit Job Pages**
```
Job 1:
  Title: "DATA ENGINEER"
  Body: "...data engineer...london...junior..."
  
Job 2:
  Title: "SENIOR DATA ENGINEER"
  Body: "...data engineer...london...senior..."
```

**Step 5: Keyword Matching**
```
Job 1:
  Role Match: ✅ "data engineer" in title
  City Match: ✅ "london" in body
  Seniority Match: ✅ "junior" in body
  Not Job: ✅ No blog/story keywords
  RESULT: ✅ MATCHED

Job 2:
  Role Match: ✅ "data engineer" in title
  City Match: ✅ "london" in body
  Seniority Match: ✅ "senior" in body (flexible)
  Not Job: ✅ No blog/story keywords
  RESULT: ✅ MATCHED
```

**Step 6: Customize CVs**
```
Job 1 CV: Emphasized junior-level experience, London preference
Job 2 CV: Highlighted senior-ready skills, London preference
```

**Step 7: Email Results**
```
Subject: Your Job Search Results - 2 Matches Found

Deliveroo
=========
✅ Verified: We visited their careers page and found 2 matching jobs

📌 DATA ENGINEER
📍 London
✨ Customized CV: [...]

📌 SENIOR DATA ENGINEER
📍 London
✨ Customized CV: [...]
```

---

## 🎯 Why This Logic Works

### **1. AI Role Expansion**
- Catches similar roles you might miss
- Understands industry terminology
- Flexible but controlled

### **2. Hard Keyword Matching**
- Fast and reliable
- No API costs per job
- Predictable results
- Easy to debug

### **3. Flexible Filtering**
- Excludes obvious non-jobs
- Allows some flexibility on city/seniority
- Focuses on role match as primary criteria

### **4. Verification Proof**
- Shows we actually visited the site
- Builds trust
- Provides direct links to apply

---

## 🚀 Performance

**For 10 companies:**
- AI Role Expansion: ~30 seconds (1 API call)
- Find Careers URLs: ~1-2 minutes (10 API calls)
- Scrape Jobs: ~4-5 minutes (50-100 page visits)
- Customize CVs: ~1-2 minutes (20 API calls)

**Total: ~6-8 minutes**

**API Calls:**
- OpenAI: ~30-40 calls
- Web Pages: ~50-100 visits

---

## 📝 Summary

**The logic is:**
1. ✅ Use AI to expand roles (smart)
2. ✅ Visit careers pages (real data)
3. ✅ Extract job URLs (filtered)
4. ✅ Hard keyword match (fast & reliable)
5. ✅ Customize CVs (personalized)
6. ✅ Email with proof (trustworthy)

**This approach balances:**
- 🎯 Accuracy (keyword matching)
- 🚀 Speed (no AI per job)
- 💰 Cost (minimal API calls)
- 🔍 Coverage (AI role expansion)

# 🎓 Software Development Guide for Data Analysts

> **Goal:** Help you transition from Data Analyst to Software Engineer by explaining concepts we used in this project

---

## 📚 Table of Contents

1. [Web Development Basics](#web-development-basics)
2. [JavaScript vs TypeScript](#javascript-vs-typescript)
3. [Frontend vs Backend](#frontend-vs-backend)
4. [React & Next.js](#react--nextjs)
5. [APIs & Routes](#apis--routes)
6. [State Management](#state-management)
7. [Async Programming](#async-programming)
8. [File System Operations](#file-system-operations)
9. [Web Scraping](#web-scraping)
10. [Project Structure](#project-structure)

---

## 🌐 Web Development Basics

### **Think of a Website Like a Restaurant:**

| Restaurant | Website |
|---|---|
| **Kitchen** (where food is made) | **Backend** (server, database) |
| **Dining Area** (where customers sit) | **Frontend** (what users see) |
| **Menu** (what you can order) | **API** (what actions you can do) |
| **Waiter** (brings food to table) | **HTTP Requests** (fetch data) |

### **How Websites Work (Simple Version):**

```
1. You type: www.example.com
   ↓
2. Your browser asks: "Hey server, give me the homepage!"
   ↓
3. Server responds: "Here's the HTML, CSS, and JavaScript"
   ↓
4. Your browser displays: The beautiful website you see
```

---

## 💻 JavaScript vs TypeScript

### **JavaScript (JS)**

Think of JavaScript as **English without grammar rules**:

```javascript
// JavaScript - No rules!
let age = 25;
age = "twenty-five"; // ✅ Allowed (but confusing!)
age = true; // ✅ Also allowed (even more confusing!)
```

**Problem:** You can accidentally break things and not know until it's too late.

### **TypeScript (TS)**

Think of TypeScript as **English with grammar rules**:

```typescript
// TypeScript - Has rules!
let age: number = 25;
age = "twenty-five"; // ❌ ERROR! Age must be a number!
age = true; // ❌ ERROR! Age must be a number!
```

**Benefit:** Catches mistakes BEFORE you run the code.

### **Real Example from Our Project:**

```typescript
// We defined what a "Submission" looks like
interface Submission {
  id: string;           // Must be text
  roles: string[];      // Must be a list of text
  seniority: string;    // Must be text
  cities: string[];     // Must be a list of text
  visa: boolean;        // Must be true/false
}

// Now TypeScript helps us:
const mySubmission: Submission = {
  id: "123",
  roles: ["Data Engineer"],
  seniority: "Junior",
  cities: ["London"],
  visa: 123  // ❌ ERROR! TypeScript says: "visa must be true/false, not a number!"
};
```

**Why This Matters:**
- In Excel/Python, if you put text where a number should be, you get errors
- TypeScript does the same thing for web development
- It's like having spell-check for your code!

---

## 🎨 Frontend vs Backend

### **Frontend = What Users See**

**Like Excel's Interface:**
- Buttons, forms, tables
- Colors, fonts, layout
- What happens when you click

**In Our Project:**
- `app/page.tsx` - The homepage with the form
- `app/step2/page.tsx` - The company expansion page
- `app/step4/page.tsx` - The job results page

**Technologies:**
- **HTML** - Structure (like Excel cells)
- **CSS** - Styling (like Excel formatting)
- **React** - Interactive components (like Excel formulas that update automatically)

### **Backend = What Users Don't See**

**Like Excel's Formulas & Data:**
- Processing data
- Saving to files/database
- Complex calculations

**In Our Project:**
- `app/api/submit/route.ts` - Saves form data
- `app/api/scrape-jobs-agent/route.ts` - Scrapes job listings
- `app/api/expand-companies/route.ts` - Uses AI to suggest companies

**Technologies:**
- **Node.js** - JavaScript that runs on the server (not in browser)
- **File System** - Reading/writing files (like saving Excel files)
- **APIs** - Endpoints that frontend can call (like Excel macros)

---

## ⚛️ React & Next.js

### **React = Building Blocks**

**Think of React Like LEGO Blocks:**

Instead of building a whole house at once, you build small pieces:

```typescript
// A "Button" component (like a LEGO block)
function MyButton() {
  return <button>Click Me</button>;
}

// A "Form" component (made of multiple blocks)
function MyForm() {
  return (
    <div>
      <MyButton />
      <MyButton />
      <MyButton />
    </div>
  );
}
```

**Real Example from Our Project:**

```typescript
// app/page.tsx - Our homepage
export default function HomePage() {
  return (
    <main>
      <h1>Job Searcher</h1>
      <form>
        <input type="text" />
        <button>Submit</button>
      </form>
    </main>
  );
}
```

### **Next.js = React + Superpowers**

**Next.js adds:**
1. **Routing** - Different pages automatically (Step 1, Step 2, Step 3)
2. **API Routes** - Backend code in the same project
3. **File-based routing** - Create `app/step2/page.tsx` → automatically becomes `/step2` URL

**File Structure:**
```
app/
  page.tsx          → www.yoursite.com/
  step2/
    page.tsx        → www.yoursite.com/step2
  step3/
    page.tsx        → www.yoursite.com/step3
  api/
    submit/
      route.ts      → www.yoursite.com/api/submit
```

**Like Excel Sheets:**
- Each sheet is a different page
- Each page has its own content
- You can link between them

---

## 🔌 APIs & Routes

### **What is an API?**

**Think of an API like a Restaurant Menu:**

```
Menu (API):
- Order Pizza → GET /api/pizza
- Order Pasta → GET /api/pasta
- Place Custom Order → POST /api/order
```

**In Our Project:**

```typescript
// app/api/submit/route.ts
export async function POST(req: Request) {
  // 1. Receive data from frontend
  const formData = await req.formData();
  
  // 2. Process it
  const roles = formData.get("roles");
  
  // 3. Save to file
  await saveToFile(roles);
  
  // 4. Send response back
  return NextResponse.json({ success: true });
}
```

**How Frontend Calls It:**

```typescript
// app/page.tsx
async function submitForm() {
  // Call the API (like ordering from menu)
  const response = await fetch("/api/submit", {
    method: "POST",
    body: formData
  });
  
  // Get the response (like receiving your food)
  const data = await response.json();
  console.log(data); // { success: true }
}
```

### **HTTP Methods (Like SQL Commands):**

| SQL | HTTP | What It Does |
|---|---|---|
| `SELECT` | `GET` | Read data |
| `INSERT` | `POST` | Create new data |
| `UPDATE` | `PUT/PATCH` | Modify data |
| `DELETE` | `DELETE` | Remove data |

---

## 🎯 State Management

### **What is State?**

**Think of State like Variables in Excel:**

In Excel:
```
A1 = 10
A2 = 20
A3 = A1 + A2  → Updates automatically when A1 or A2 changes
```

In React:
```typescript
const [count, setCount] = useState(10);  // Like A1 = 10

// When you change it:
setCount(20);  // Like changing A1 to 20

// Everything that uses 'count' updates automatically!
```

### **Real Example from Our Project:**

```typescript
// app/step4/page.tsx
export default function Step4Page() {
  // State variables (like Excel cells)
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function scrapeJobs() {
    setLoading(true);  // Show loading spinner
    
    try {
      const data = await fetch("/api/scrape-jobs");
      setResults(data);  // Update results
    } catch (err) {
      setError(err);  // Show error message
    } finally {
      setLoading(false);  // Hide loading spinner
    }
  }

  // UI updates automatically when state changes!
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {results.map(result => <div>{result.company}</div>)}
    </div>
  );
}
```

**Why This Matters:**
- Like Excel formulas that auto-update
- Change one variable → UI updates everywhere
- No need to manually refresh the page

---

## ⏳ Async Programming

### **Synchronous vs Asynchronous**

**Synchronous (Blocking) - Like Standing in Line:**

```typescript
// Step 1: Make coffee (wait 5 minutes)
makeCoffee();  // ⏳ You wait here...

// Step 2: Make toast (wait 2 minutes)
makeToast();  // ⏳ You wait here...

// Total time: 7 minutes
```

**Asynchronous (Non-blocking) - Like Multitasking:**

```typescript
// Start coffee (5 min) - don't wait!
makeCoffee();  // ⚡ Start and move on

// Start toast (2 min) - don't wait!
makeToast();  // ⚡ Start and move on

// Total time: 5 minutes (they run at the same time!)
```

### **Real Example from Our Project:**

```typescript
// app/api/scrape-jobs-agent/route.ts

// ❌ BAD: Process companies one by one (slow)
for (const company of companies) {
  await scrapeCompany(company);  // Wait for each one
}
// Takes: 10 companies × 30 seconds = 5 minutes

// ✅ GOOD: Process companies in parallel (fast)
const promises = companies.map(company => scrapeCompany(company));
await Promise.all(promises);  // All at once!
// Takes: 30 seconds (all run together)
```

### **Async/Await Keywords:**

```typescript
// Without async/await (confusing!)
fetch("/api/data")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// With async/await (cleaner!)
async function getData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

**Think of `await` like:**
- "Wait for this to finish before moving to the next line"
- Like waiting for a SQL query to complete before using the results

---

## 📁 File System Operations

### **Reading & Writing Files**

**Like Excel VBA File Operations:**

```typescript
// Import file system module
import { readFile, writeFile } from "fs/promises";

// Read a file (like opening an Excel file)
const content = await readFile("data.txt", "utf-8");
console.log(content);  // "Hello World"

// Write to a file (like saving an Excel file)
await writeFile("output.txt", "New data");

// Append to a file (like adding rows to Excel)
await writeFile("log.txt", "New log entry\n", { flag: "a" });
```

### **Real Example from Our Project:**

```typescript
// app/api/submit/route.ts

// Save uploaded CV
const uploadPath = path.join(process.cwd(), "uploads", "cv_123.txt");
await writeFile(uploadPath, cvContent);

// Save submission data
const submissions = await readFile("data/submissions.json", "utf-8");
const data = JSON.parse(submissions);
data.push(newSubmission);
await writeFile("data/submissions.json", JSON.stringify(data));
```

### **Path Operations:**

```typescript
import path from "path";

// Join paths (works on Windows and Mac)
const filePath = path.join("uploads", "cv_123.txt");
// Result: "uploads/cv_123.txt"

// Get current directory
const currentDir = process.cwd();
// Result: "/Users/you/Documents/job_searcher"

// Get absolute path
const absolutePath = path.join(process.cwd(), "uploads", "cv.txt");
// Result: "/Users/you/Documents/job_searcher/uploads/cv.txt"
```

---

## 🕷️ Web Scraping

### **What is Web Scraping?**

**Think of it like Copy-Pasting from Websites Automatically:**

Instead of:
1. Open website
2. Copy job title
3. Paste into Excel
4. Repeat 100 times

You write code that:
1. Opens website automatically
2. Finds all job titles
3. Saves them to a file
4. Done in 10 seconds!

### **How We Did It:**

```typescript
// app/api/scrape-jobs-agent/route.ts

// 1. Launch a browser (invisible)
const browser = await chromium.launch({ headless: true });

// 2. Open a new page
const page = await browser.newPage();

// 3. Go to the website
await page.goto("https://company.com/careers");

// 4. Wait for content to load
await page.waitForTimeout(3000);

// 5. Extract data from the page
const jobLinks = await page.evaluate(() => {
  // This code runs IN THE BROWSER
  const links = Array.from(document.querySelectorAll('a'));
  return links.map(link => ({
    text: link.innerText,
    url: link.href
  }));
});

// 6. Close the browser
await browser.close();

// 7. Now you have the data!
console.log(jobLinks);
```

### **Why We Used Playwright:**

**Playwright = Automated Browser**

```
Regular browsing:
You → Click buttons → See results

Playwright:
Your code → Clicks buttons → Gets results
```

**Benefits:**
- Can handle JavaScript-loaded content
- Can fill forms automatically
- Can click buttons
- Can wait for elements to appear

---

## 🏗️ Project Structure

### **Our Project Layout:**

```
job_searcher/
├── app/                          # Frontend & Backend
│   ├── page.tsx                  # Homepage (Step 1)
│   ├── step2/
│   │   └── page.tsx              # Step 2 page
│   ├── step3/
│   │   └── page.tsx              # Step 3 page
│   ├── step4/
│   │   └── page.tsx              # Step 4 page
│   ├── api/                      # Backend APIs
│   │   ├── submit/
│   │   │   └── route.ts          # Handle form submission
│   │   ├── expand-companies/
│   │   │   └── route.ts          # AI company expansion
│   │   ├── find-careers-urls/
│   │   │   └── route.ts          # Find careers pages
│   │   └── scrape-jobs-agent/
│   │       └── route.ts          # Scrape jobs with AI
│   └── globals.css               # Styling
├── data/
│   └── submissions.json          # Saved form data
├── uploads/
│   └── cv_*.txt                  # Uploaded CVs
├── package.json                  # Dependencies (like requirements.txt)
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

### **How Data Flows:**

```
Step 1 (Form)
    ↓ Submit
API: /api/submit
    ↓ Save to file
data/submissions.json
    ↓ Load in Step 2
Step 2 (Company Expansion)
    ↓ Call AI
API: /api/expand-companies
    ↓ Save to localStorage
Step 3 (Find Careers URLs)
    ↓ Call AI
API: /api/find-careers-urls
    ↓ Save to localStorage
Step 4 (Scrape Jobs)
    ↓ Use Playwright
API: /api/scrape-jobs-agent
    ↓ Display results
User sees job matches!
```

---

## 🎓 Key Principles We Used

### **1. Separation of Concerns**

**Like Excel Sheets:**
- One sheet for raw data
- One sheet for calculations
- One sheet for charts

**In Our Project:**
- Frontend pages (UI)
- API routes (logic)
- Data files (storage)

### **2. DRY (Don't Repeat Yourself)**

**Bad:**
```typescript
// Repeated code
const company1 = "Google";
const company2 = "Facebook";
const company3 = "Amazon";
```

**Good:**
```typescript
// Reusable
const companies = ["Google", "Facebook", "Amazon"];
companies.forEach(company => console.log(company));
```

### **3. Error Handling**

**Always expect things to fail:**

```typescript
try {
  // Try to do something
  const data = await fetchData();
} catch (error) {
  // If it fails, handle it gracefully
  console.error("Failed to fetch data:", error);
  showErrorMessage("Something went wrong!");
}
```

### **4. Type Safety**

**Define what data looks like:**

```typescript
interface JobListing {
  title: string;
  location: string;
  url: string;
}

// Now TypeScript helps you avoid mistakes
const job: JobListing = {
  title: "Data Engineer",
  location: "London",
  url: "https://..."
};
```

---

## 🚀 From Data Analyst to Software Engineer

### **Skills You Already Have:**

| Data Analyst Skill | Software Engineering Equivalent |
|---|---|
| SQL queries | API calls, database queries |
| Excel formulas | Functions, state management |
| Data cleaning | Input validation, error handling |
| Dashboards | Frontend UI components |
| Python scripts | Backend API routes |
| Data pipelines | Async workflows |

### **New Skills You Learned:**

1. ✅ **Frontend Development** - Building user interfaces
2. ✅ **Backend Development** - Creating APIs
3. ✅ **TypeScript** - Type-safe programming
4. ✅ **React** - Component-based UI
5. ✅ **Next.js** - Full-stack framework
6. ✅ **Web Scraping** - Automated data collection
7. ✅ **Async Programming** - Non-blocking operations
8. ✅ **File System** - Reading/writing files
9. ✅ **Git** - Version control
10. ✅ **API Design** - Creating endpoints

---

## 📝 Quick Reference

### **Common Commands:**

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### **Common Patterns:**

```typescript
// 1. Fetch data from API
const response = await fetch("/api/data");
const data = await response.json();

// 2. Update state
const [value, setValue] = useState(initialValue);
setValue(newValue);

// 3. Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  await fetch("/api/submit", { method: "POST", body: formData });
}

// 4. Read file
const content = await readFile(filePath, "utf-8");

// 5. Write file
await writeFile(filePath, content);
```

---

## 🎯 Next Steps

### **To Solidify Your Learning:**

1. **Build a similar project** - Try creating a different web app
2. **Read documentation** - Next.js, React, TypeScript official docs
3. **Practice TypeScript** - Convert JavaScript code to TypeScript
4. **Learn more about APIs** - RESTful API design principles
5. **Explore databases** - PostgreSQL, MongoDB (instead of JSON files)

### **Recommended Resources:**

- **Next.js Tutorial:** https://nextjs.org/learn
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **React Documentation:** https://react.dev/learn
- **MDN Web Docs:** https://developer.mozilla.org/

---

## 💡 Remember

**Software Development is like Data Analysis:**
- Both solve problems with code
- Both require logical thinking
- Both need testing and debugging
- Both benefit from good documentation

**You already have the mindset!** You just need to learn the tools. 🚀

---

**Questions?** Review this guide whenever you need a refresher on concepts we used in the job searcher project!

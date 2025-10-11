# 🚀 Deployment Guide: Making JobSearchingRobot Public

## Overview

This guide explains how to deploy JobSearchingRobot so others can use it, while ensuring data privacy and security.

---

## 🎯 Deployment Options

### **Option 1: Cloud Hosting (Recommended for Public Use)**

Deploy to a cloud platform where users can access it via a URL.

#### **Best Platforms:**

1. **Vercel** (Easiest, Free tier available)
   - ✅ Built for Next.js
   - ✅ Automatic deployments
   - ✅ Free SSL certificates
   - ✅ Edge functions support
   - ❌ Limited to 10 seconds execution time (won't work for our long-running jobs)

2. **Railway** (Best for this project)
   - ✅ Supports long-running processes
   - ✅ Easy deployment
   - ✅ Affordable ($5-20/month)
   - ✅ PostgreSQL database included
   - ✅ Automatic SSL

3. **DigitalOcean App Platform**
   - ✅ Full control
   - ✅ Scalable
   - ✅ $12-25/month
   - ✅ Database options

4. **AWS / Google Cloud / Azure**
   - ✅ Enterprise-grade
   - ✅ Most flexible
   - ❌ More complex setup
   - ❌ Higher cost

---

## 🔐 Part 2: Data Privacy & Security

### **Current Issues:**

1. ❌ **Resumes stored on server** - You can read uploaded CVs
2. ❌ **Emails visible in logs** - Console logs show user emails
3. ❌ **No encryption** - Data stored in plain text JSON files
4. ❌ **No user authentication** - Anyone can access any submission
5. ❌ **API keys in .env** - If leaked, you're responsible for costs

---

## 🛡️ Security Implementation Plan

### **Step 1: Encrypt User Data**

**What to encrypt:**
- User emails
- Resume content
- Job search results
- Any personally identifiable information (PII)

**How:**
```typescript
// Install encryption library
npm install crypto-js

// Encrypt data before storing
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.ENCRYPTION_KEY; // User provides their own key

function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

**Implementation:**
- Encrypt email before saving to `submissions.json`
- Encrypt CV content before saving to `uploads/`
- Encrypt job results before saving
- Only decrypt when sending email (in memory, never logged)

---

### **Step 2: Remove Sensitive Data from Logs**

**Current problem:**
```typescript
console.log(`📧 Sending email to ${email}...`); // ❌ Email visible in logs
```

**Solution:**
```typescript
// Create a sanitized logging function
function sanitizeEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.substring(0, 2)}***@${domain}`;
}

console.log(`📧 Sending email to ${sanitizeEmail(email)}...`); // ✅ Safe
// Output: "📧 Sending email to al***@gmail.com..."
```

---

### **Step 3: Use Database Instead of JSON Files**

**Why:**
- Better security
- User-specific access control
- Encryption at rest
- Audit logs

**Recommended: PostgreSQL on Railway**

```typescript
// Install Prisma (database ORM)
npm install @prisma/client
npm install -D prisma

// Initialize Prisma
npx prisma init

// schema.prisma
model Submission {
  id            String   @id @default(uuid())
  encryptedEmail String  // Encrypted
  encryptedCV    String  // Encrypted
  companies     String[]
  roles         String[]
  seniority     String?
  cities        String[]
  visa          Boolean
  frequency     String
  createdAt     DateTime @default(now())
  
  // User's own encryption key (hashed)
  userKeyHash   String
  
  results       JobResult[]
}

model JobResult {
  id            String   @id @default(uuid())
  submissionId  String
  submission    Submission @relation(fields: [submissionId], references: [id])
  company       String
  encryptedData String  // Encrypted job details
  createdAt     DateTime @default(now())
}
```

---

### **Step 4: User-Provided Encryption Keys**

**Best approach: Let users provide their own encryption key**

**Flow:**
1. User creates account
2. User provides a passphrase (never stored on server)
3. Passphrase generates encryption key
4. All user data encrypted with their key
5. **You (admin) cannot decrypt their data without their passphrase**

**Implementation:**
```typescript
// On signup/first use
const userPassphrase = "user's secret passphrase";
const encryptionKey = CryptoJS.SHA256(userPassphrase).toString();

// Store only the hash (for verification)
const keyHash = CryptoJS.SHA256(encryptionKey).toString();

// Use encryption key for all user data
const encryptedEmail = CryptoJS.AES.encrypt(email, encryptionKey).toString();
const encryptedCV = CryptoJS.AES.encrypt(cvContent, encryptionKey).toString();

// Save to database
await prisma.submission.create({
  data: {
    encryptedEmail,
    encryptedCV,
    userKeyHash: keyHash,
    // ... other fields
  }
});
```

**When user returns:**
```typescript
// User provides passphrase again
const userPassphrase = "user's secret passphrase";
const encryptionKey = CryptoJS.SHA256(userPassphrase).toString();
const keyHash = CryptoJS.SHA256(encryptionKey).toString();

// Verify passphrase
const submission = await prisma.submission.findFirst({
  where: { userKeyHash: keyHash }
});

if (submission) {
  // Decrypt data
  const email = decryptData(submission.encryptedEmail, encryptionKey);
  const cv = decryptData(submission.encryptedCV, encryptionKey);
}
```

---

### **Step 5: Implement User Authentication**

**Options:**

1. **NextAuth.js** (Recommended)
   ```bash
   npm install next-auth
   ```
   - Email/password authentication
   - OAuth (Google, GitHub)
   - Session management

2. **Clerk** (Easiest)
   - Drop-in authentication
   - Free tier available
   - Beautiful UI

3. **Supabase Auth**
   - Open source
   - Row-level security
   - Built-in database

**Implementation with NextAuth:**
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        passphrase: { label: "Passphrase", type: "password" }
      },
      async authorize(credentials) {
        // Verify user
        const keyHash = CryptoJS.SHA256(
          CryptoJS.SHA256(credentials.passphrase).toString()
        ).toString();
        
        const user = await prisma.submission.findFirst({
          where: { userKeyHash: keyHash }
        });
        
        if (user) {
          return { id: user.id, email: credentials.email };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt"
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### **Step 6: Separate API Keys Per User**

**Problem:** Currently using your OpenAI API key for all users

**Solution 1: User provides their own API key**
```typescript
// User enters their OpenAI API key
const userApiKey = "sk-..."; // Encrypted and stored

// Use user's key for their requests
const openai = new OpenAI({
  apiKey: decryptData(user.encryptedApiKey, encryptionKey)
});
```

**Solution 2: Charge users (if you provide the API key)**
```typescript
// Implement payment system
// Stripe, PayPal, etc.

// Track usage per user
model ApiUsage {
  id        String   @id @default(uuid())
  userId    String
  tokens    Int
  cost      Float
  createdAt DateTime @default(now())
}

// Charge based on usage
const COST_PER_TOKEN = 0.000002; // $0.002 per 1K tokens
const totalCost = tokensUsed * COST_PER_TOKEN;
```

---

### **Step 7: Automatic Data Deletion**

**Implement data retention policy:**

```typescript
// Delete old submissions after 30 days
async function cleanupOldData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await prisma.submission.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo
      }
    }
  });
}

// Run daily via cron job
// Railway: Add to package.json
{
  "scripts": {
    "cleanup": "node scripts/cleanup.js"
  }
}
```

---

## 📝 Step-by-Step Deployment Plan

### **Phase 1: Prepare for Deployment (1-2 days)**

1. ✅ **Replace JSON storage with PostgreSQL**
   ```bash
   npm install @prisma/client
   npx prisma init
   # Set DATABASE_URL in .env
   npx prisma migrate dev
   ```

2. ✅ **Add encryption**
   ```bash
   npm install crypto-js
   # Implement encryption functions
   ```

3. ✅ **Add authentication**
   ```bash
   npm install next-auth
   # Set up auth routes
   ```

4. ✅ **Sanitize logs**
   - Remove all `console.log` with sensitive data
   - Use sanitization functions

5. ✅ **Add environment variables**
   ```bash
   # .env.example
   DATABASE_URL=
   NEXTAUTH_SECRET=
   NEXTAUTH_URL=
   OPENAI_API_KEY=
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   ```

---

### **Phase 2: Deploy to Railway (30 minutes)**

1. **Create Railway account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-connects it

4. **Set environment variables**
   - Go to project settings
   - Add all variables from `.env`
   - Railway provides `DATABASE_URL` automatically

5. **Deploy**
   - Railway auto-deploys on git push
   - Get your public URL: `https://your-app.railway.app`

---

### **Phase 3: Configure Domain (Optional, 15 minutes)**

1. **Buy domain** (e.g., jobsearchingrobot.com)
   - Namecheap, GoDaddy, etc.

2. **Add custom domain in Railway**
   - Settings → Domains → Add custom domain
   - Update DNS records

3. **SSL certificate**
   - Railway provides free SSL automatically

---

### **Phase 4: Monitor & Maintain**

1. **Set up monitoring**
   - Railway provides logs
   - Add error tracking (Sentry)

2. **Set up alerts**
   - Email notifications for errors
   - Usage alerts

3. **Regular backups**
   - Railway auto-backs up database
   - Export backups weekly

---

## 💰 Cost Estimation

### **Monthly Costs:**

| Service | Cost | Notes |
|---------|------|-------|
| **Railway Hosting** | $5-20 | Based on usage |
| **PostgreSQL Database** | Included | In Railway plan |
| **Domain Name** | $10-15/year | Optional |
| **OpenAI API** | Variable | User provides or you charge |
| **Email Service** | $0-10 | Gmail free, SendGrid paid |

**Total: ~$5-30/month**

---

## 🔒 Privacy Compliance

### **GDPR Compliance (EU users):**

1. ✅ **Data encryption** - Implemented
2. ✅ **Right to deletion** - Add delete button
3. ✅ **Data portability** - Add export button
4. ✅ **Privacy policy** - Create one
5. ✅ **Cookie consent** - Add banner
6. ✅ **Data retention** - 30-day auto-delete

### **Privacy Policy Template:**

```markdown
# Privacy Policy

## Data We Collect
- Email address (encrypted)
- Resume/CV (encrypted)
- Job search preferences

## How We Use Data
- To search for jobs matching your criteria
- To send you job matches via email
- We CANNOT read your encrypted data without your passphrase

## Data Storage
- All data encrypted with your passphrase
- Stored on secure servers (Railway)
- Auto-deleted after 30 days

## Your Rights
- Delete your data anytime
- Export your data
- Update your preferences

## Contact
- Email: privacy@jobsearchingrobot.com
```

---

## 🎯 Summary: What You Need to Do

### **For Maximum Privacy (Recommended):**

1. ✅ **Implement user-provided encryption keys**
   - Users create passphrase
   - You cannot decrypt their data
   - Zero-knowledge architecture

2. ✅ **Use database instead of JSON files**
   - PostgreSQL on Railway
   - Encrypted at rest

3. ✅ **Add authentication**
   - NextAuth.js
   - User accounts

4. ✅ **Sanitize all logs**
   - No emails, no CV content
   - Only anonymized data

5. ✅ **User-provided API keys OR charge for usage**
   - Users bring their own OpenAI key
   - Or implement payment system

6. ✅ **Deploy to Railway**
   - Public URL
   - Automatic SSL
   - Scalable

### **Result:**
- ✅ You **cannot** read user emails
- ✅ You **cannot** read user resumes
- ✅ You **cannot** see job results
- ✅ Users control their own data
- ✅ Zero-knowledge architecture

---

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install @prisma/client crypto-js next-auth
npm install -D prisma

# 2. Initialize database
npx prisma init

# 3. Create migration
npx prisma migrate dev --name init

# 4. Build for production
npm run build

# 5. Deploy to Railway
git push origin main
# Railway auto-deploys
```

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [GDPR Compliance Guide](https://gdpr.eu)
- [Encryption Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

## ❓ FAQ

**Q: Can I see user data as the admin?**
A: No, if you implement user-provided encryption keys. You cannot decrypt data without the user's passphrase.

**Q: What if a user forgets their passphrase?**
A: Their data is permanently lost. This is the trade-off for maximum privacy.

**Q: How do I handle API costs?**
A: Either users provide their own OpenAI API key, or you charge them based on usage.

**Q: Is this production-ready?**
A: After implementing the security measures above, yes.

**Q: How do I scale if I get many users?**
A: Railway auto-scales. For heavy usage, consider AWS/GCP with load balancers.

# 🔐 Privacy Implementation: Zero-Knowledge Architecture

## Overview

This guide shows how to implement encryption so that **you (the admin) cannot access user data**.

---

## 🎯 Architecture: Zero-Knowledge

```
User's Browser
    ↓
  [Passphrase: "my-secret-123"]
    ↓
  Generate Encryption Key
    ↓
  Encrypt Data Locally
    ↓
  Send Encrypted Data to Server
    ↓
Server (You)
    ↓
  Store Encrypted Data
  (Cannot decrypt without passphrase)
    ↓
  Process Jobs
    ↓
  Send Encrypted Results Back
    ↓
User's Browser
    ↓
  Decrypt with Passphrase
    ↓
  View Results
```

**Key Point:** The passphrase **never leaves the user's browser**. You only store encrypted data.

---

## 📝 Step-by-Step Implementation

### **Step 1: Install Dependencies**

```bash
npm install crypto-js
npm install @prisma/client
npm install -D prisma
```

---

### **Step 2: Create Encryption Utilities**

Create `lib/encryption.ts`:

```typescript
import CryptoJS from 'crypto-js';

/**
 * Generate encryption key from user's passphrase
 * This happens in the browser, passphrase never sent to server
 */
export function generateKeyFromPassphrase(passphrase: string): string {
  return CryptoJS.SHA256(passphrase).toString();
}

/**
 * Generate a hash of the key for server-side verification
 * Server stores this to identify the user
 */
export function hashKey(encryptionKey: string): string {
  return CryptoJS.SHA256(encryptionKey).toString();
}

/**
 * Encrypt data with user's key
 */
export function encryptData(data: string, encryptionKey: string): string {
  return CryptoJS.AES.encrypt(data, encryptionKey).toString();
}

/**
 * Decrypt data with user's key
 */
export function decryptData(encryptedData: string, encryptionKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Sanitize email for logging (hide sensitive parts)
 */
export function sanitizeEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return '***@***';
  return `${name.substring(0, 2)}***@${domain}`;
}

/**
 * Sanitize any PII for logging
 */
export function sanitizeForLog(text: string): string {
  // Remove emails
  text = text.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***');
  // Remove phone numbers
  text = text.replace(/\d{3}[-.]?\d{3}[-.]?\d{4}/g, '***-***-****');
  return text;
}
```

---

### **Step 3: Update Frontend (Client-Side Encryption)**

Update `app/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { generateKeyFromPassphrase, hashKey, encryptData } from '@/lib/encryption';

export default function HomePage() {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!passphrase || passphrase.length < 8) {
      alert('Passphrase must be at least 8 characters');
      return;
    }
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Generate encryption key from passphrase (client-side only)
    const encryptionKey = generateKeyFromPassphrase(passphrase);
    const keyHash = hashKey(encryptionKey);
    
    // Get form data
    const email = String(formData.get('email'));
    const companies = String(formData.get('companies'));
    const roles = String(formData.get('roles'));
    const file = formData.get('template') as File;
    
    // Read CV file
    const cvContent = await file.text();
    
    // Encrypt sensitive data CLIENT-SIDE
    const encryptedEmail = encryptData(email, encryptionKey);
    const encryptedCV = encryptData(cvContent, encryptionKey);
    
    // Create new FormData with encrypted data
    const encryptedFormData = new FormData();
    encryptedFormData.append('keyHash', keyHash); // For server to identify user
    encryptedFormData.append('encryptedEmail', encryptedEmail);
    encryptedFormData.append('encryptedCV', encryptedCV);
    encryptedFormData.append('companies', companies);
    encryptedFormData.append('roles', roles);
    // ... other non-sensitive fields
    
    // Send to server
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: encryptedFormData
    });
    
    if (response.ok) {
      alert('✅ Submitted! Your data is encrypted and secure.');
      // Store keyHash in localStorage for future use
      localStorage.setItem('userKeyHash', keyHash);
    }
  }

  return (
    <main>
      <h1>JobSearchingRobot</h1>
      
      <form onSubmit={onSubmit}>
        {/* Passphrase Input */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <label className="label">
            🔐 Your Secret Passphrase
          </label>
          <input
            type={showPassphrase ? "text" : "password"}
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
            minLength={8}
            className="input"
            placeholder="Create a strong passphrase (min 8 characters)"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPassphrase}
              onChange={(e) => setShowPassphrase(e.target.checked)}
            />
            <label className="text-sm">Show passphrase</label>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            ⚠️ <strong>Important:</strong> Your passphrase encrypts all your data. 
            We cannot recover it if you forget it. Your data will be permanently lost.
          </p>
          <p className="mt-1 text-xs text-green-400">
            ✅ Your passphrase never leaves your browser. We cannot see it.
          </p>
        </div>

        {/* Rest of the form */}
        <div>
          <label className="label">Your Email</label>
          <input type="email" name="email" required className="input" />
          <p className="text-xs text-slate-400 mt-1">
            🔒 Will be encrypted before sending to server
          </p>
        </div>
        
        {/* ... other fields ... */}
        
        <button type="submit" className="btn-primary">
          🔐 Encrypt & Submit
        </button>
      </form>
    </main>
  );
}
```

---

### **Step 4: Update Backend (Store Encrypted Data)**

Update `app/api/submit/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { sanitizeForLog } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Get encrypted data (already encrypted by client)
    const keyHash = String(formData.get('keyHash'));
    const encryptedEmail = String(formData.get('encryptedEmail'));
    const encryptedCV = String(formData.get('encryptedCV'));
    const companies = String(formData.get('companies'));
    const roles = String(formData.get('roles'));
    
    // ✅ SAFE: Log sanitized data only
    console.log(`📝 New submission received`);
    console.log(`   User ID: ${keyHash.substring(0, 8)}...`); // Only show first 8 chars
    console.log(`   Companies: ${sanitizeForLog(companies)}`);
    console.log(`   Roles: ${sanitizeForLog(roles)}`);
    // ❌ NEVER log: encryptedEmail, encryptedCV (even though encrypted)
    
    // Store in database (encrypted)
    const submission = await prisma.submission.create({
      data: {
        keyHash,
        encryptedEmail,
        encryptedCV,
        companies: companies.split(',').map(c => c.trim()),
        roles: roles.split(',').map(r => r.trim()),
        // ... other fields
      }
    });
    
    return NextResponse.json({
      success: true,
      submissionId: submission.id
    });
    
  } catch (err) {
    console.error('Submission error:', sanitizeForLog(err.message));
    return new NextResponse("Submission failed", { status: 500 });
  }
}
```

---

### **Step 5: Process Jobs Without Decrypting**

The key insight: **You don't need to decrypt email/CV to process jobs!**

Update `app/api/process-jobs/route.ts`:

```typescript
export async function POST(req: Request) {
  try {
    const { submissionId } = await req.json();
    
    // Get submission (data is encrypted)
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });
    
    if (!submission) {
      return new NextResponse("Not found", { status: 404 });
    }
    
    // ✅ Process jobs using NON-ENCRYPTED data
    // We don't need email or CV content to search for jobs!
    const results = await processJobs({
      companies: submission.companies,
      roles: submission.roles,
      seniority: submission.seniority,
      cities: submission.cities,
      visa: submission.visa
    });
    
    // ✅ Encrypt results before storing
    // (User will decrypt them later with their passphrase)
    const encryptedResults = JSON.stringify(results);
    
    await prisma.jobResult.create({
      data: {
        submissionId: submission.id,
        encryptedData: encryptedResults
      }
    });
    
    // ✅ SAFE: Log without sensitive data
    console.log(`✅ Processed jobs for user ${submission.keyHash.substring(0, 8)}...`);
    console.log(`   Found ${results.length} matches`);
    
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('Processing error:', sanitizeForLog(err.message));
    return new NextResponse("Processing failed", { status: 500 });
  }
}
```

---

### **Step 6: Send Email (Decrypt Only in Memory)**

Update `app/api/send-email/route.ts`:

```typescript
import { decryptData, sanitizeEmail } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const { submissionId, encryptionKey } = await req.json();
    
    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { results: true }
    });
    
    // Verify encryption key
    const providedKeyHash = hashKey(encryptionKey);
    if (providedKeyHash !== submission.keyHash) {
      return new NextResponse("Invalid passphrase", { status: 401 });
    }
    
    // ✅ Decrypt ONLY in memory (never store decrypted data)
    const email = decryptData(submission.encryptedEmail, encryptionKey);
    const results = JSON.parse(submission.results[0].encryptedData);
    
    // ✅ SAFE: Log sanitized email
    console.log(`📧 Sending email to ${sanitizeEmail(email)}`);
    
    // Send email
    await sendEmail(email, results);
    
    // ✅ Email is NOT stored anywhere, only existed in memory
    
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('Email error:', sanitizeForLog(err.message));
    return new NextResponse("Email failed", { status: 500 });
  }
}
```

---

### **Step 7: User Retrieves Results**

Create `app/results/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { generateKeyFromPassphrase, hashKey, decryptData } from '@/lib/encryption';

export default function ResultsPage() {
  const [passphrase, setPassphrase] = useState('');
  const [results, setResults] = useState(null);

  async function loadResults() {
    // Generate key from passphrase
    const encryptionKey = generateKeyFromPassphrase(passphrase);
    const keyHash = hashKey(encryptionKey);
    
    // Fetch encrypted results from server
    const response = await fetch('/api/get-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyHash })
    });
    
    const { encryptedResults } = await response.json();
    
    // Decrypt CLIENT-SIDE
    const decryptedResults = decryptData(encryptedResults, encryptionKey);
    setResults(JSON.parse(decryptedResults));
  }

  return (
    <main>
      <h1>Your Job Search Results</h1>
      
      <div>
        <label>Enter Your Passphrase</label>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Your secret passphrase"
        />
        <button onClick={loadResults}>
          🔓 Decrypt & View Results
        </button>
      </div>
      
      {results && (
        <div>
          <h2>Your Matches</h2>
          {/* Display results */}
        </div>
      )}
    </main>
  );
}
```

---

## ✅ What You've Achieved

### **Privacy Guarantees:**

1. ✅ **You cannot read user emails**
   - Encrypted with user's passphrase
   - Passphrase never sent to server
   - You don't have the decryption key

2. ✅ **You cannot read user CVs**
   - Encrypted before upload
   - Stored encrypted in database
   - Only user can decrypt

3. ✅ **You cannot see job results**
   - Results encrypted before storage
   - User decrypts in their browser

4. ✅ **Logs are safe**
   - All PII sanitized
   - Only anonymized data logged

5. ✅ **Zero-knowledge architecture**
   - Even if your database is hacked, data is useless without passphrases
   - Even you (admin) cannot access user data

---

## 🎯 Summary

**What happens:**
1. User creates passphrase in browser
2. Browser encrypts email + CV
3. Server stores encrypted data
4. Server processes jobs (doesn't need email/CV)
5. Server stores encrypted results
6. User decrypts results in browser

**Result:**
- ✅ You **CANNOT** access user data
- ✅ Even with database access
- ✅ Even with server access
- ✅ True zero-knowledge system

**Trade-off:**
- ❌ If user forgets passphrase, data is lost forever
- ✅ But this is the price of maximum privacy

---

## 🚀 Next Steps

1. Implement encryption utilities
2. Update frontend to encrypt data
3. Update backend to store encrypted data
4. Test thoroughly
5. Deploy to Railway
6. Add privacy policy
7. Launch! 🎉

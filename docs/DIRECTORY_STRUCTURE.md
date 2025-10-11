# 📁 Project Directory Structure

## Overview

```
job_searcher/
├── 📄 README.md                    # Main project README
├── 📄 package.json                 # Dependencies
├── 📄 tsconfig.json                # TypeScript config
├── 📄 next.config.mjs              # Next.js config
├── 📄 tailwind.config.ts           # Tailwind CSS config
│
├── 🐳 Dockerfile                   # Docker container recipe
├── 🐳 docker-compose.yml           # Multi-container orchestration
├── 📄 .dockerignore                # Files to exclude from Docker
├── 📄 env.example                  # Environment variables template
├── 📄 deploy.sh                    # Quick deployment script
│
├── 📁 app/                         # Next.js app directory
│   ├── page.tsx                    # Main UI (form)
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # App layout
│   │
│   └── 📁 api/                     # API routes
│       ├── submit/                 # Submit form data
│       ├── process-jobs/           # Automated job processing
│       ├── scrape-jobs-agent/      # Manual job scraping
│       ├── send-email/             # Email sending
│       ├── expand-companies/       # Company expansion
│       └── find-careers-urls/      # Find careers pages
│
├── 📁 data/                        # Local data storage
│   └── submissions.json            # User submissions (gitignored)
│
├── 📁 uploads/                     # Uploaded CV files (gitignored)
│
├── 📁 terraform/                   # Infrastructure as Code
│   ├── main.tf                     # Main Terraform config
│   ├── variables.tf                # Input variables
│   ├── outputs.tf                  # Output values
│   ├── cloud-init.yaml             # VM initialization script
│   └── terraform.tfvars.example    # Example variables
│
└── 📁 docs/                        # 📚 DOCUMENTATION
    ├── README.md                   # Documentation index
    ├── INFRASTRUCTURE_QUICKSTART.md # Start here!
    ├── DIRECTORY_STRUCTURE.md      # This file
    │
    ├── 📁 guides/                  # How to use the app
    │   ├── AUTOMATED_SERVICE_GUIDE.md
    │   └── JOB_MATCHING_LOGIC.md
    │
    ├── 📁 deployment/              # Deployment guides
    │   ├── DEPLOYMENT_GUIDE.md     # All options
    │   ├── RENDER_DEPLOYMENT.md    # Render (recommended)
    │   ├── FLY_DEPLOYMENT.md       # Fly.io (requires card)
    │   ├── QUICK_DEPLOY.md         # Quick reference
    │   └── PRIVACY_IMPLEMENTATION.md # Security
    │
    └── 📁 learning/                # Learning resources
        ├── DOCKER_LEARNING_GUIDE.md
        ├── TERRAFORM_GUIDE.md
        ├── JAVASCRIPT_BASICS.md
        └── SOFTWARE_DEVELOPMENT_GUIDE.md
```

---

## 📚 Documentation Organization

### **Principle: Single Responsibility**

Each document has ONE clear purpose:

| Document | Purpose | Audience |
|----------|---------|----------|
| **README.md** (root) | Project overview, quick start | Everyone |
| **docs/README.md** | Documentation index | Everyone |
| **INFRASTRUCTURE_QUICKSTART.md** | Choose your path | New users |
| **guides/** | How to use features | End users |
| **deployment/** | How to deploy | Developers |
| **learning/** | Deep learning | Students |

---

## 🗂️ Why This Structure?

### **1. Separation of Concerns**

```
Code (app/) ≠ Documentation (docs/)
```

- Code changes don't clutter docs
- Docs changes don't clutter code
- Easy to find what you need

---

### **2. Progressive Disclosure**

```
README.md (high-level)
   ↓
docs/README.md (index)
   ↓
Specific guides (detailed)
```

- Start simple, go deeper as needed
- Don't overwhelm beginners
- Experts can jump to specific guides

---

### **3. Logical Grouping**

```
guides/     → Using the app
deployment/ → Deploying the app
learning/   → Learning infrastructure
```

- Related docs together
- Easy to navigate
- Clear mental model

---

## 📖 How to Navigate

### **I want to...**

**Deploy quickly**
```
README.md
   ↓
docs/deployment/RENDER_DEPLOYMENT.md
```

**Learn infrastructure**
```
README.md
   ↓
docs/INFRASTRUCTURE_QUICKSTART.md
   ↓
docs/learning/DOCKER_LEARNING_GUIDE.md
```

**Understand job matching**
```
docs/guides/JOB_MATCHING_LOGIC.md
```

**Implement encryption**
```
docs/deployment/PRIVACY_IMPLEMENTATION.md
```

---

## 🎯 File Naming Convention

### **Pattern: `[CATEGORY]_[TOPIC].md`**

Examples:
- `DOCKER_LEARNING_GUIDE.md` - Learning guide about Docker
- `RENDER_DEPLOYMENT.md` - Deployment guide for Render
- `JOB_MATCHING_LOGIC.md` - Guide about job matching

### **Benefits:**
- ✅ Self-documenting names
- ✅ Easy to search
- ✅ Alphabetically organized
- ✅ Clear purpose

---

## 🔄 Document Relationships

```
INFRASTRUCTURE_QUICKSTART.md (hub)
         ↓
    ┌────┴────┬────────────┐
    ↓         ↓            ↓
deployment/ guides/    learning/
    ↓         ↓            ↓
  Render   Matching    Docker
  Fly.io   Logic       Terraform
  Privacy              JavaScript
```

**Hub-and-spoke model:**
- Central index points to specific guides
- Guides link to related guides
- No circular dependencies

---

## 📝 Adding New Documentation

### **Step 1: Determine Category**

Ask: "What is the primary purpose?"

- **Using a feature** → `guides/`
- **Deploying** → `deployment/`
- **Learning a skill** → `learning/`

### **Step 2: Name the File**

Format: `[CATEGORY]_[TOPIC].md`

Examples:
- `guides/EMAIL_CONFIGURATION.md`
- `deployment/AWS_DEPLOYMENT.md`
- `learning/KUBERNETES_GUIDE.md`

### **Step 3: Update Index**

Add link to `docs/README.md` in appropriate section.

### **Step 4: Cross-Reference**

Link from related documents.

---

## 🎓 Best Practices

### **1. Keep Root Clean**

```
✅ Good:
job_searcher/
├── README.md
├── package.json
└── docs/
    └── (all docs here)

❌ Bad:
job_searcher/
├── README.md
├── GUIDE1.md
├── GUIDE2.md
├── TUTORIAL.md
└── HOW_TO.md
```

---

### **2. Use Descriptive Names**

```
✅ Good:
- DOCKER_LEARNING_GUIDE.md
- RENDER_DEPLOYMENT.md
- JOB_MATCHING_LOGIC.md

❌ Bad:
- guide.md
- deploy.md
- logic.md
```

---

### **3. Group Related Content**

```
✅ Good:
deployment/
├── RENDER_DEPLOYMENT.md
├── FLY_DEPLOYMENT.md
└── AWS_DEPLOYMENT.md

❌ Bad:
docs/
├── RENDER.md
├── DOCKER.md
├── FLY.md
└── TERRAFORM.md
```

---

## 🔍 Finding Documentation

### **Method 1: Start at Root**

1. Open `README.md`
2. Click link to `docs/README.md`
3. Find your topic

### **Method 2: Direct Navigation**

Know what you want? Go directly:
- Deployment → `docs/deployment/`
- Learning → `docs/learning/`
- Guides → `docs/guides/`

### **Method 3: Search**

```bash
# Find all docs about Docker
grep -r "Docker" docs/

# Find deployment guides
ls docs/deployment/
```

---

## 🎉 Benefits of This Structure

### **For Users:**
- ✅ Easy to find what you need
- ✅ Clear learning path
- ✅ Not overwhelming

### **For Maintainers:**
- ✅ Easy to add new docs
- ✅ Clear organization
- ✅ No duplication

### **For Contributors:**
- ✅ Know where to add docs
- ✅ Consistent structure
- ✅ Easy to review

---

## 📚 Related Documents

- [Documentation Index](./README.md)
- [Infrastructure Quickstart](./INFRASTRUCTURE_QUICKSTART.md)
- [Deployment Guide](./deployment/DEPLOYMENT_GUIDE.md)

---

**This structure follows industry best practices used at Google, Microsoft, and other tech companies!**

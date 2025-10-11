# 🐳 Dockerfile Explained (Plain English)

## 🎯 What is a Dockerfile?

**Simple answer:** A recipe that tells Docker how to build your app into a container.

**Analogy:** Like a cooking recipe
- **Ingredients** = Base image + dependencies
- **Steps** = Commands (FROM, RUN, COPY, etc.)
- **Final dish** = Running container

---

## 📖 Your Dockerfile: Step-by-Step

### **🏗️ The Big Picture: Multi-Stage Build**

Your Dockerfile has **4 stages**:

```
Stage 1: BASE      → Install system packages (Chromium, fonts)
   ↓
Stage 2: DEPS      → Install npm packages (node_modules)
   ↓
Stage 3: BUILDER   → Build Next.js app (compile TypeScript)
   ↓
Stage 4: RUNNER    → Final image (only production files)
```

**Why 4 stages?**
- Keeps final image small (~200MB instead of ~1GB)
- Faster builds (Docker caches each stage)
- More secure (no build tools in production)

---

## 🔍 Stage-by-Stage Breakdown

### **Stage 1: BASE (Foundation)**

```dockerfile
FROM node:18-alpine AS base
```

**What it does:**
- Starts with official Node.js 18 image
- Uses Alpine Linux (very small, ~5MB)
- Names this stage "base"

**Why:**
- We need Node.js to run our app
- Alpine is tiny = faster downloads
- We'll reuse this in other stages

---

```dockerfile
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
```

**What it does:**
- Installs system packages using Alpine's package manager (apk)
- `--no-cache` = Don't save package index (saves space)

**What each package does:**
- **chromium** = Web browser for scraping job sites
- **nss** = Security library (Chromium needs this)
- **freetype** = Renders fonts
- **harfbuzz** = Shapes text (for different languages)
- **ca-certificates** = SSL certificates (for HTTPS)
- **ttf-freefont** = Free fonts

**Why:**
- Your app uses Playwright to scrape websites
- Playwright needs a real browser (Chromium)
- Browser needs fonts and security libraries

---

```dockerfile
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**What it does:**
- Sets environment variables
- Tells Playwright to use our installed Chromium

**Why:**
- Playwright normally downloads its own browser (~100MB)
- We already installed Chromium above
- This saves space and time

---

### **Stage 2: DEPS (Dependencies)**

```dockerfile
FROM base AS deps
WORKDIR /app
```

**What it does:**
- Starts from "base" stage
- Sets working directory to `/app`

**Why:**
- Reuse the base image (with Chromium already installed)
- All commands now run from `/app` directory

---

```dockerfile
COPY package*.json ./
RUN npm ci
```

**What it does:**
- Copies `package.json` and `package-lock.json` into container
- Runs `npm ci` (clean install)

**Why copy only package files first?**
- Docker caches each step
- If package.json unchanged, Docker reuses this layer
- Saves time on rebuilds!

**What is `npm ci`?**
- Like `npm install` but faster and more reliable
- Installs exact versions from `package-lock.json`
- Creates `node_modules/` folder

---

### **Stage 3: BUILDER (Build App)**

```dockerfile
FROM base AS builder
WORKDIR /app
```

**What it does:**
- Starts from "base" again (fresh start)
- Sets working directory

**Why start from base again?**
- We don't need the package files from "deps"
- We'll copy the built `node_modules` instead

---

```dockerfile
COPY --from=deps /app/node_modules ./node_modules
```

**What it does:**
- Copies `node_modules/` from the "deps" stage
- `--from=deps` = Get files from previous stage

**Why:**
- Reuse dependencies we already installed
- Don't install them again (faster!)

---

```dockerfile
COPY . .
```

**What it does:**
- Copies ALL your source code into the container
- First `.` = Your computer's current directory
- Second `.` = Container's `/app` directory

**What gets copied:**
- `app/` folder (your Next.js code)
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- etc.

---

```dockerfile
RUN npm run build
```

**What it does:**
- Runs `next build` (from your package.json)

**What `next build` does:**
1. Compiles TypeScript → JavaScript
2. Optimizes React components
3. Bundles CSS and images
4. Creates static pages
5. Generates server code

**Result:**
- `.next/` folder with production-ready app
- `.next/standalone/` = Optimized server
- `.next/static/` = CSS, JS, images

---

### **Stage 4: RUNNER (Production)**

```dockerfile
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
```

**What it does:**
- Starts from "base" one more time
- Sets working directory
- Sets Node.js to production mode

**Why start from base again?**
- This is the FINAL stage
- Only this stage goes into the deployed image
- We don't want source code or build tools

**What is `NODE_ENV=production`?**
- Tells Node.js to run in production mode
- Disables dev tools
- Enables optimizations
- Improves performance

---

```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
```

**What it does:**
- Creates a group called "nodejs" (ID: 1001)
- Creates a user called "nextjs" (ID: 1001)

**Why:**
- **Security!** Never run as root user
- If app is hacked, attacker only has limited permissions
- Best practice for production

**Analogy:**
- Root user = Admin with full access
- nextjs user = Limited user, can only run the app

---

```dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
```

**What it does:**
- Copies production files from "builder" stage
- `--chown=nextjs:nodejs` = Make nextjs user the owner

**What gets copied:**
- `public/` = Static files (images, fonts)
- `.next/standalone/` = Optimized server code
- `.next/static/` = CSS, JS, images

**What does NOT get copied:**
- Source code (app/ folder)
- node_modules/ (too big, not needed)
- Build tools
- Dev dependencies

**Result:** Small, secure image!

---

```dockerfile
RUN mkdir -p /app/data /app/uploads && chown -R nextjs:nodejs /app/data /app/uploads
```

**What it does:**
- Creates `data/` and `uploads/` directories
- Makes nextjs user the owner

**Why:**
- Your app needs to write files:
  - `data/submissions.json` = User submissions
  - `uploads/` = Uploaded CV files
- nextjs user needs write permission

---

```dockerfile
USER nextjs
```

**What it does:**
- Switches to nextjs user
- All subsequent commands run as nextjs

**Why:**
- Security! App runs as non-root user
- If compromised, attacker has limited access

---

```dockerfile
EXPOSE 3000
```

**What it does:**
- Documents that app listens on port 3000
- Doesn't actually open the port (that's done when running)

**Why:**
- Tells Docker and developers which port to use
- Documentation for other developers

---

```dockerfile
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
```

**What it does:**
- Sets environment variables for the app
- `PORT=3000` = Next.js listens on port 3000
- `HOSTNAME="0.0.0.0"` = Accept connections from anywhere

**Why "0.0.0.0"?**
- `localhost` = Only accept connections from same machine
- `0.0.0.0` = Accept connections from anywhere
- Containers need to accept external connections

---

```dockerfile
CMD ["node", "server.js"]
```

**What it does:**
- Runs `node server.js` when container starts
- This starts your Next.js app

**Where is server.js?**
- Created by `next build` in the builder stage
- Located in `.next/standalone/`

---

## 🎯 Key Concepts Explained

### **1. Multi-Stage Build**

**Problem:** If we build everything in one stage:
```
Source code (50MB)
+ node_modules (500MB)
+ Build tools (200MB)
+ Built app (100MB)
= 850MB image 😱
```

**Solution:** Multi-stage build:
```
Stage 1: Install system packages
Stage 2: Install npm packages
Stage 3: Build app
Stage 4: Copy only production files
= 200MB image ✅
```

**How it works:**
- Each `FROM` starts a new stage
- Final image only includes last stage
- Earlier stages are discarded

---

### **2. Layer Caching**

**How Docker builds images:**
```
Step 1: FROM node:18-alpine     → Layer 1 (cached)
Step 2: RUN apk add chromium    → Layer 2 (cached)
Step 3: COPY package.json       → Layer 3 (cached if unchanged)
Step 4: RUN npm ci              → Layer 4 (cached if package.json unchanged)
Step 5: COPY . .                → Layer 5 (always runs, code changes)
Step 6: RUN npm run build       → Layer 6 (runs if code changed)
```

**Why this matters:**
- First build: 10 minutes
- Rebuild (code changed): 2 minutes (reuses cached layers)
- Rebuild (dependencies changed): 5 minutes

---

### **3. Security: Non-Root User**

**Bad (running as root):**
```
App runs as root
   ↓
App is hacked
   ↓
Attacker has root access
   ↓
Can delete files, install malware, access other containers
```

**Good (running as nextjs user):**
```
App runs as nextjs user
   ↓
App is hacked
   ↓
Attacker has limited access
   ↓
Can only access app files, can't harm system
```

---

### **4. .dockerignore**

**What it does:**
- Like `.gitignore` but for Docker
- Lists files to NOT copy into container

**Your `.dockerignore`:**
```
node_modules    # Don't copy (we install fresh)
.next           # Don't copy (we build fresh)
.git            # Don't copy (not needed)
data            # Don't copy (runtime data)
uploads         # Don't copy (runtime data)
```

**Why:**
- Faster builds (less to copy)
- Smaller images
- No sensitive data in image

---

## 📊 Size Comparison

### **Without multi-stage build:**
```
Base image:           50 MB
System packages:      80 MB
node_modules:        500 MB
Source code:          50 MB
Build artifacts:     100 MB
Dev dependencies:    200 MB
─────────────────────────
Total:               980 MB 😱
```

### **With multi-stage build:**
```
Base image:           50 MB
System packages:      80 MB
Production code:      50 MB
Static assets:        20 MB
─────────────────────────
Total:               200 MB ✅
```

**Savings: 780 MB (80% smaller!)**

---

## 🎓 Dockerfile Commands Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `FROM` | Start from base image | `FROM node:18-alpine` |
| `RUN` | Execute command | `RUN npm install` |
| `COPY` | Copy files | `COPY . .` |
| `WORKDIR` | Set working directory | `WORKDIR /app` |
| `ENV` | Set environment variable | `ENV NODE_ENV=production` |
| `EXPOSE` | Document port | `EXPOSE 3000` |
| `USER` | Switch user | `USER nextjs` |
| `CMD` | Default command | `CMD ["node", "server.js"]` |

---

## 🔄 Build Process Flow

```
1. Read Dockerfile
   ↓
2. Pull base image (node:18-alpine)
   ↓
3. STAGE 1: Install system packages
   ↓
4. STAGE 2: Install npm packages
   ↓
5. STAGE 3: Build Next.js app
   ↓
6. STAGE 4: Create production image
   ↓
7. Save final image
   ↓
8. Push to registry (Fly.io, Docker Hub, etc.)
```

---

## 💡 Best Practices (Used in Your Dockerfile)

### ✅ **1. Use Alpine Linux**
- Smallest base image
- Faster downloads
- Less attack surface

### ✅ **2. Multi-stage builds**
- Smaller final image
- Faster builds (caching)
- More secure

### ✅ **3. Copy package.json first**
- Better caching
- Faster rebuilds

### ✅ **4. Run as non-root user**
- Security best practice
- Limits damage if compromised

### ✅ **5. Use .dockerignore**
- Faster builds
- Smaller images
- No sensitive data

### ✅ **6. Set NODE_ENV=production**
- Better performance
- Disables dev tools

---

## 🎯 Common Questions

### **Q: Why so many stages?**
**A:** Each stage has a purpose:
- base = System dependencies
- deps = npm packages
- builder = Build app
- runner = Production image

Only the last stage goes into the final image.

---

### **Q: Why copy package.json separately?**
**A:** Docker caching!
- If package.json unchanged, reuses cached layer
- Saves 5-10 minutes on rebuilds

---

### **Q: Why create a nextjs user?**
**A:** Security!
- Never run as root in production
- Limits damage if app is hacked

---

### **Q: What's the difference between COPY and ADD?**
**A:** 
- `COPY` = Simple file copy
- `ADD` = Copy + extract archives + download URLs
- Use `COPY` (simpler, more predictable)

---

### **Q: What's the difference between CMD and RUN?**
**A:**
- `RUN` = Execute during build (install packages, build app)
- `CMD` = Execute when container starts (run app)

---

### **Q: Can I have multiple CMD?**
**A:** No, only the last CMD is used. Use `CMD` for the main process.

---

## 🚀 Next Steps

1. **Read your Dockerfile** - Now you understand every line!
2. **Try building locally:**
   ```bash
   docker build -t job-searcher .
   ```
3. **Run the container:**
   ```bash
   docker run -p 3000:3000 job-searcher
   ```
4. **Learn more:** `docs/learning/DOCKER_LEARNING_GUIDE.md`

---

## 📚 Additional Resources

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

**You now understand how Docker containers are built!** 🎉

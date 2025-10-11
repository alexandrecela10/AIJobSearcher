# 🐳 Docker & Infrastructure Learning Guide

## 🎯 Goal
Learn containerization, infrastructure, and deployment by deploying your JobSearchingRobot.

---

## 📖 What You'll Learn

### **Core Concepts:**
1. **Containers** - Lightweight, isolated environments
2. **Images** - Blueprints for containers
3. **Dockerfile** - Recipe to build images
4. **Docker Compose** - Orchestrate multiple containers
5. **Volumes** - Persistent data storage
6. **Networks** - Container communication
7. **Environment Variables** - Configuration management

### **Infrastructure Skills:**
1. Linux server management
2. Reverse proxies (Nginx)
3. SSL certificates
4. Domain management
5. Monitoring & logging
6. CI/CD pipelines

---

## 🔰 Level 1: Docker Basics (Local)

### **What is Docker?**

**Simple explanation:**
- **Container** = A lightweight, isolated box that runs your app
- **Image** = A snapshot/template of your app + dependencies
- **Dockerfile** = Instructions to create an image

**Analogy:**
- **Dockerfile** = Recipe
- **Image** = Cake batter (ready to bake)
- **Container** = Baked cake (running instance)

---

### **Install Docker Desktop**

```bash
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

---

### **Understanding Your Dockerfile**

Let's break down the Dockerfile I created for you:

```dockerfile
# 1. BASE IMAGE
FROM node:18-alpine AS base
# Explanation: Start with Node.js 18 on Alpine Linux (small, efficient)

# 2. INSTALL SYSTEM DEPENDENCIES
RUN apk add --no-cache chromium nss freetype
# Explanation: Install Chromium browser for Playwright (web scraping)

# 3. BUILD STAGE (Install npm packages)
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Explanation: Install Node.js dependencies in isolated stage

# 4. BUILD STAGE (Compile Next.js)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Explanation: Build optimized production version

# 5. PRODUCTION STAGE (Final image)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy only what's needed for production
COPY --from=builder /app/.next/standalone ./
# Explanation: Multi-stage build = smaller final image
```

**Key Concepts:**

1. **Multi-stage builds** - Build in stages, only keep final result
2. **Layer caching** - Docker caches each step for faster rebuilds
3. **Minimal final image** - Only production files, no dev dependencies

---

### **Build Your First Docker Image**

```bash
# Navigate to your project
cd /Users/alexandrecela/Documents/job_searcher

# Build the image
docker build -t job-searcher:v1 .

# Explanation:
# - `docker build` = Build an image
# - `-t job-searcher:v1` = Tag it as "job-searcher" version 1
# - `.` = Use Dockerfile in current directory
```

**What happens:**
1. Docker reads your Dockerfile
2. Executes each instruction (FROM, RUN, COPY, etc.)
3. Creates layers (cached for speed)
4. Produces final image

**Check your image:**
```bash
docker images
# You'll see: job-searcher:v1
```

---

### **Run Your Container**

```bash
# Run the container
docker run -p 3000:3000 \
  -e OPENAI_API_KEY="sk-your-key" \
  -e SMTP_HOST="smtp.gmail.com" \
  -e SMTP_PORT="587" \
  -e SMTP_USER="your-email@gmail.com" \
  -e SMTP_PASS="your-password" \
  job-searcher:v1

# Explanation:
# - `docker run` = Create and start a container
# - `-p 3000:3000` = Map port 3000 (host) to 3000 (container)
# - `-e VAR=value` = Set environment variables
# - `job-searcher:v1` = Use this image
```

**Visit:** http://localhost:3000

**Congratulations! Your app is containerized!** 🎉

---

### **Useful Docker Commands**

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a container
docker stop <container-id>

# Remove a container
docker rm <container-id>

# View logs
docker logs <container-id>

# Execute command inside container
docker exec -it <container-id> /bin/sh

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune
```

---

## 🎼 Level 2: Docker Compose (Orchestration)

### **What is Docker Compose?**

**Problem:** Running containers manually is tedious
- Need to remember all flags
- Hard to manage multiple containers
- No easy way to restart everything

**Solution:** Docker Compose
- Define everything in `docker-compose.yml`
- Start/stop with one command
- Manage multiple services together

---

### **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  # Your Next.js app
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    volumes:
      # Persist data and uploads
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    depends_on:
      - postgres

  # PostgreSQL database (for future encryption features)
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=jobsearcher
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=jobsearcher
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Nginx reverse proxy (SSL, caching, load balancing)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

**Key Concepts:**

1. **Services** - Each container (app, database, nginx)
2. **Volumes** - Persistent storage (survives container restarts)
3. **Networks** - Containers can talk to each other by service name
4. **Environment variables** - Configuration from `.env` file
5. **Depends_on** - Start order (database before app)

---

### **Create .env file**

```bash
# .env
OPENAI_API_KEY=sk-your-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
DB_PASSWORD=secure-password-here
```

---

### **Run with Docker Compose**

```bash
# Start all services
docker-compose up -d

# Explanation:
# - `up` = Start services
# - `-d` = Detached mode (run in background)

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a service
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build
```

**What happens:**
1. Docker Compose reads `docker-compose.yml`
2. Creates network for services to communicate
3. Starts PostgreSQL
4. Starts your app
5. Starts Nginx
6. All services can talk to each other!

---

## 🌐 Level 3: Deploy to Cloud (Oracle Cloud - Free Forever)

### **Why Oracle Cloud?**

- ✅ **FREE forever** (not a trial)
- ✅ **No credit card required**
- ✅ **2 VMs** (1GB RAM each)
- ✅ **100GB storage**
- ✅ **10TB bandwidth/month**

---

### **Step 1: Create Oracle Cloud Account**

1. Go to https://www.oracle.com/cloud/free/
2. Sign up (no credit card needed)
3. Choose region closest to you

---

### **Step 2: Create a VM Instance**

1. Go to **Compute** → **Instances**
2. Click **Create Instance**
3. Choose:
   - **Image:** Ubuntu 22.04
   - **Shape:** VM.Standard.E2.1.Micro (free tier)
   - **Network:** Create new VCN
   - **SSH keys:** Generate or upload your key
4. Click **Create**

---

### **Step 3: Configure Firewall**

```bash
# SSH into your VM
ssh ubuntu@<your-vm-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add user to docker group
sudo usermod -aG docker ubuntu

# Logout and login again
exit
ssh ubuntu@<your-vm-ip>

# Verify
docker --version
docker-compose --version
```

---

### **Step 4: Deploy Your App**

```bash
# Clone your repository
git clone https://github.com/your-username/job_searcher.git
cd job_searcher

# Create .env file
nano .env
# (paste your environment variables)

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Your app is now running on the cloud!** 🎉

---

### **Step 5: Configure Domain & SSL**

```bash
# Install Certbot (for free SSL)
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔄 Level 4: CI/CD (Automated Deployments)

### **What is CI/CD?**

**CI (Continuous Integration):**
- Automatically test code when you push to GitHub
- Catch bugs early

**CD (Continuous Deployment):**
- Automatically deploy to production when tests pass
- No manual deployment needed

---

### **Create GitHub Actions Workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/ubuntu/job_searcher
            git pull origin main
            docker-compose down
            docker-compose up -d --build
```

**What this does:**
1. Triggers on every push to `main` branch
2. SSHs into your server
3. Pulls latest code
4. Rebuilds and restarts containers

**Set up secrets in GitHub:**
1. Go to your repo → Settings → Secrets
2. Add `SERVER_IP` and `SSH_PRIVATE_KEY`

**Now every git push automatically deploys!** 🚀

---

## 🚀 Level 5: Kubernetes (Advanced - Optional)

### **What is Kubernetes?**

**Docker Compose** = Manage containers on ONE server
**Kubernetes** = Manage containers across MANY servers

**When you need Kubernetes:**
- 1000+ users
- Need auto-scaling
- Need high availability (99.9% uptime)
- Multiple regions

**For now, you DON'T need Kubernetes.** Docker Compose is perfect for your scale.

---

## 📊 Comparison: Deployment Options

| Method | Learning Value | Cost | Complexity | Best For |
|--------|---------------|------|------------|----------|
| **Docker (Local)** | ⭐⭐⭐⭐⭐ | Free | Low | Learning |
| **Docker Compose** | ⭐⭐⭐⭐⭐ | Free | Medium | Production-ready |
| **Oracle Cloud** | ⭐⭐⭐⭐⭐ | Free | Medium | Real deployment |
| **Fly.io** | ⭐⭐⭐ | Free | Low | Quick deploy |
| **Vercel** | ⭐ | Free | Very Low | No learning |
| **Kubernetes** | ⭐⭐⭐⭐⭐ | $$$ | Very High | Enterprise |

---

## 🎯 Recommended Learning Path

### **Week 1: Docker Basics**
- ✅ Build Docker image
- ✅ Run containers
- ✅ Understand Dockerfile
- ✅ Learn Docker commands

### **Week 2: Docker Compose**
- ✅ Create docker-compose.yml
- ✅ Add PostgreSQL
- ✅ Add Nginx
- ✅ Manage multi-container apps

### **Week 3: Cloud Deployment**
- ✅ Set up Oracle Cloud VM
- ✅ Deploy with Docker Compose
- ✅ Configure domain & SSL
- ✅ Monitor & maintain

### **Week 4: CI/CD**
- ✅ Set up GitHub Actions
- ✅ Automated testing
- ✅ Automated deployment
- ✅ Rollback strategies

---

## 📚 Resources to Learn More

### **Docker:**
- [Docker Official Tutorial](https://docs.docker.com/get-started/)
- [Docker for Beginners (YouTube)](https://www.youtube.com/watch?v=fqMOX6JJhGo)

### **Docker Compose:**
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Docker Compose Tutorial](https://www.youtube.com/watch?v=Qw9zlE3t8Ko)

### **Linux Server:**
- [Linux Journey](https://linuxjourney.com/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

### **Nginx:**
- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)

### **CI/CD:**
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## 🎓 Key Principles (Ray Dalio Style)

### **Principle 1: Containers = Isolation**
Each service runs in its own container. If one crashes, others keep running.

### **Principle 2: Infrastructure as Code**
Everything defined in files (Dockerfile, docker-compose.yml). Version controlled, reproducible.

### **Principle 3: Immutable Infrastructure**
Don't modify running containers. Build new image, deploy new container.

### **Principle 4: Separation of Concerns**
- App container = Your code
- Database container = Data storage
- Nginx container = Web server
Each does ONE thing well.

### **Principle 5: Automate Everything**
Manual deployments = errors. CI/CD = consistency.

---

## ✅ Next Steps

1. **Start with Level 1** - Build Docker image locally
2. **Move to Level 2** - Create docker-compose.yml
3. **Deploy to Level 3** - Oracle Cloud (free)
4. **Automate with Level 4** - GitHub Actions CI/CD

**You'll learn real software engineering skills used at Google, Amazon, Netflix!**

# ============================================================================
# STAGE 1: BASE IMAGE
# ============================================================================
# Purpose: Create a foundation with Node.js and system dependencies
# Why: We build on top of this in multiple stages to keep things organized

# FROM = Start from an existing image
# node:18-alpine = Official Node.js 18 on Alpine Linux (small, efficient)
# AS base = Name this stage "base" so we can reference it later
FROM node:18-alpine AS base

# Install system-level packages needed for Playwright (web scraping)
# RUN = Execute a command inside the container
# apk = Alpine Linux package manager (like apt-get on Ubuntu)
# --no-cache = Don't save package index (keeps image smaller)
# Packages installed:
#   - chromium: Browser for web scraping
#   - nss: Network Security Services (needed by Chromium)
#   - freetype: Font rendering library
#   - harfbuzz: Text shaping engine
#   - ca-certificates: SSL certificates for HTTPS
#   - ttf-freefont: Free fonts for rendering
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Configure Playwright to use the Chromium we just installed
# ENV = Set environment variable (available to all processes in container)
# Why: Playwright normally downloads its own browser, but we already installed one
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser


# ============================================================================
# STAGE 2: INSTALL DEPENDENCIES
# ============================================================================
# Purpose: Install Node.js packages (npm dependencies)
# Why: Separate stage so Docker can cache this layer (faster rebuilds)

# Start from our base image and name this stage "deps"
FROM base AS deps

# WORKDIR = Set working directory (like 'cd /app')
# All subsequent commands run from this directory
WORKDIR /app

# COPY = Copy files from your computer into the container
# package*.json = Both package.json and package-lock.json
# ./ = Into current directory (/app)
# Why: We copy only package files first (not all code) for better caching
COPY package*.json ./

# npm ci = Clean install (faster, more reliable than 'npm install')
# Why: Installs exact versions from package-lock.json
# Result: node_modules/ folder with all dependencies
RUN npm ci


# ============================================================================
# STAGE 3: BUILD THE APP
# ============================================================================
# Purpose: Compile TypeScript and build Next.js for production
# Why: Separate stage keeps build artifacts isolated

# Start from base again and name this stage "builder"
FROM base AS builder

WORKDIR /app

# Copy node_modules from the "deps" stage
# --from=deps = Get files from the "deps" stage we built earlier
# Why: Reuse dependencies instead of installing again (faster!)
COPY --from=deps /app/node_modules ./node_modules

# Copy all source code into the container
# . . = Copy everything from current directory to /app
# Why: Now we have both dependencies AND code, ready to build
COPY . .

# Build the Next.js app for production
# npm run build = Runs "next build" (from package.json)
# What it does:
#   1. Compiles TypeScript to JavaScript
#   2. Optimizes React components
#   3. Creates static assets
#   4. Generates server code
# Result: .next/ folder with production-ready app
RUN npm run build


# ============================================================================
# STAGE 4: PRODUCTION IMAGE (FINAL)
# ============================================================================
# Purpose: Create the smallest possible image with only what's needed to run
# Why: Smaller image = faster deployment, less disk space, more secure

# Start from base one more time and name this stage "runner"
# This is the FINAL stage - only this will be in the deployed image
FROM base AS runner

WORKDIR /app

# Set Node.js to production mode
# Why: Disables dev tools, enables optimizations, improves performance
ENV NODE_ENV=production

# ============================================================================
# SECURITY: Create non-root user
# ============================================================================
# Why: Running as root is dangerous. If app is hacked, attacker has full access.
# Solution: Create limited user with only necessary permissions

# addgroup = Create a system group named "nodejs" with ID 1001
RUN addgroup --system --gid 1001 nodejs

# adduser = Create a system user named "nextjs" with ID 1001
# This user belongs to the "nodejs" group
RUN adduser --system --uid 1001 nextjs

# ============================================================================
# Copy only production files (not source code, not dev dependencies)
# ============================================================================

# Copy static files (images, fonts, etc.)
COPY --from=builder /app/public ./public

# Copy the compiled Next.js app
# --chown=nextjs:nodejs = Make "nextjs" user the owner
# Why: The nextjs user needs to read these files
# /app/.next/standalone = Optimized server code (no unnecessary files)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, JS, images generated during build)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ============================================================================
# Create directories for runtime data
# ============================================================================
# mkdir -p = Create directories (and parent directories if needed)
# chown -R = Change owner recursively
# Why: App needs to write uploaded CVs and submission data
RUN mkdir -p /app/data /app/uploads && chown -R nextjs:nodejs /app/data /app/uploads

# ============================================================================
# Switch to non-root user
# ============================================================================
# USER = All subsequent commands run as this user
# Why: Security! If app is compromised, attacker only has "nextjs" user permissions
USER nextjs

# ============================================================================
# Configure networking
# ============================================================================

# EXPOSE = Document which port the app listens on
# Why: Tells Docker and developers "this app uses port 3000"
# Note: Doesn't actually open the port (that's done when running the container)
EXPOSE 3000

# Set environment variables for the app
# PORT = Which port Next.js should listen on
ENV PORT 3000

# HOSTNAME = Listen on all network interfaces
# "0.0.0.0" = Accept connections from anywhere (not just localhost)
# Why: Container needs to accept connections from outside
ENV HOSTNAME "0.0.0.0"

# ============================================================================
# START THE APP
# ============================================================================
# CMD = Default command to run when container starts
# ["node", "server.js"] = Run Node.js with server.js file
# Why: This starts your Next.js app in production mode
# Note: server.js was created by "next build" in the builder stage
CMD ["node", "server.js"]


# ============================================================================
# SUMMARY: Multi-Stage Build Benefits
# ============================================================================
#
# 1. SMALLER IMAGE:
#    - Final image only has: base + production files
#    - Doesn't include: source code, dev dependencies, build tools
#    - Result: ~200MB instead of ~1GB
#
# 2. FASTER BUILDS:
#    - Docker caches each stage
#    - If package.json unchanged, reuses "deps" stage
#    - Only rebuilds what changed
#
# 3. MORE SECURE:
#    - Runs as non-root user
#    - Only production code included
#    - No build tools that could be exploited
#
# 4. BETTER ORGANIZATION:
#    - Each stage has clear purpose
#    - Easy to understand and modify
#    - Industry best practice
#
# ============================================================================

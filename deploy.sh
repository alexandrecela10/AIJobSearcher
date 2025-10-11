#!/bin/bash
# Quick deployment script for JobSearchingRobot

set -e  # Exit on error

echo "🚀 JobSearchingRobot - Quick Deploy to Fly.io"
echo "=============================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Fly CLI not found in PATH"
    echo ""
    echo "Run these commands first:"
    echo "  export FLYCTL_INSTALL=\"/Users/alexandrecela/.fly\""
    echo "  export PATH=\"\$FLYCTL_INSTALL/bin:\$PATH\""
    echo ""
    exit 1
fi

echo "✅ Fly CLI found: $(flyctl version)"
echo ""

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo ""
    echo "Run: flyctl auth signup"
    echo "   or: flyctl auth login"
    echo ""
    exit 1
fi

echo "✅ Logged in as: $(flyctl auth whoami)"
echo ""

# Check if fly.toml exists
if [ ! -f "fly.toml" ]; then
    echo "📝 No fly.toml found. Running flyctl launch..."
    echo ""
    flyctl launch --no-deploy
    echo ""
fi

# Prompt for secrets
echo "🔐 Setting up secrets..."
echo ""
echo "Please enter your credentials (or press Enter to skip if already set):"
echo ""

read -p "OpenAI API Key (sk-...): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    flyctl secrets set OPENAI_API_KEY="$OPENAI_KEY"
fi

read -p "SMTP Host (e.g., smtp.gmail.com): " SMTP_HOST
if [ ! -z "$SMTP_HOST" ]; then
    flyctl secrets set SMTP_HOST="$SMTP_HOST"
fi

read -p "SMTP Port (e.g., 587): " SMTP_PORT
if [ ! -z "$SMTP_PORT" ]; then
    flyctl secrets set SMTP_PORT="$SMTP_PORT"
fi

read -p "SMTP User (your email): " SMTP_USER
if [ ! -z "$SMTP_USER" ]; then
    flyctl secrets set SMTP_USER="$SMTP_USER"
fi

read -sp "SMTP Password (app password): " SMTP_PASS
echo ""
if [ ! -z "$SMTP_PASS" ]; then
    flyctl secrets set SMTP_PASS="$SMTP_PASS"
fi

echo ""
echo "🚀 Deploying to Fly.io..."
echo "This will take 5-10 minutes..."
echo ""

flyctl deploy

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Your app is live at:"
flyctl status --json | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4 | head -1 | xargs -I {} echo "  https://{}"
echo ""
echo "Useful commands:"
echo "  flyctl logs       # View logs"
echo "  flyctl open       # Open in browser"
echo "  flyctl status     # Check status"
echo ""

#!/bin/bash

# VisuTry Test Mode Startup Script
# This script starts the application in test mode with mock services

echo "🧪 Starting VisuTry in Test Mode..."
echo "🔧 Using mock services - no external dependencies required"

# Check if .env.test exists
if [ ! -f ".env.test" ]; then
    echo "❌ Error: .env.test file not found!"
    echo "Please make sure you have created the .env.test file with mock configuration."
    exit 1
fi

# Copy test environment
echo "📋 Setting up test environment..."
cp .env.test .env.local

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clear any existing build
echo "🧹 Cleaning previous builds..."
rm -rf .next

# Start the development server in background
echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:3000"
    echo ""
    echo "🧪 Test Mode Features:"
    echo "  • Mock Twitter OAuth (use any email to login)"
    echo "  • Mock AI try-on service (instant results)"
    echo "  • Mock Stripe payments (test transactions)"
    echo "  • Mock file upload (no real storage)"
    echo ""
    echo "📋 Available Test URLs:"
    echo "  • Homepage: http://localhost:3000"
    echo "  • Mock Login: http://localhost:3000/auth/signin"
    echo "  • Dashboard: http://localhost:3000/dashboard"
    echo ""
    echo "🔧 To run integration tests:"
    echo "  npm run test:integration"
    echo ""
    echo "Press Ctrl+C to stop the server"
    
    # Keep script running
    wait $DEV_PID
else
    echo "❌ Failed to start server"
    kill $DEV_PID 2>/dev/null
    exit 1
fi

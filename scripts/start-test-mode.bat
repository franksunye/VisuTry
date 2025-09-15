@echo off
REM VisuTry Test Mode Startup Script for Windows
REM This script starts the application in test mode with mock services

echo 🧪 Starting VisuTry in Test Mode...
echo 🔧 Using mock services - no external dependencies required

REM Check if .env.test exists
if not exist ".env.test" (
    echo ❌ Error: .env.test file not found!
    echo Please make sure you have created the .env.test file with mock configuration.
    pause
    exit /b 1
)

REM Copy test environment
echo 📋 Setting up test environment...
copy .env.test .env.local >nul

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Clear any existing build
echo 🧹 Cleaning previous builds...
if exist ".next" rmdir /s /q .next

REM Start the development server
echo 🚀 Starting development server...
echo ⏳ Please wait for the server to start...
echo.

start /b npm run dev

REM Wait for server to start
timeout /t 15 /nobreak >nul

REM Check if server is running
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is running at http://localhost:3000
    echo.
    echo 🧪 Test Mode Features:
    echo   • Mock Twitter OAuth ^(use any email to login^)
    echo   • Mock AI try-on service ^(instant results^)
    echo   • Mock Stripe payments ^(test transactions^)
    echo   • Mock file upload ^(no real storage^)
    echo.
    echo 📋 Available Test URLs:
    echo   • Homepage: http://localhost:3000
    echo   • Mock Login: http://localhost:3000/auth/signin
    echo   • Dashboard: http://localhost:3000/dashboard
    echo.
    echo 🔧 To run integration tests:
    echo   npm run test:integration
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    
    REM Open browser
    start http://localhost:3000
    
    echo Press any key to stop the server...
    pause >nul
    
    REM Kill the dev server
    taskkill /f /im node.exe >nul 2>&1
) else (
    echo ❌ Failed to start server
    echo Please check the console for errors
    pause
    exit /b 1
)

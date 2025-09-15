# VisuTry Testing Guide

This guide explains how to test all VisuTry functionality without external services using our comprehensive mock system.

## 🧪 Test Mode Overview

Test mode allows you to:
- ✅ Test all core functionality without API keys
- ✅ Simulate user authentication and sessions
- ✅ Test AI try-on features with mock results
- ✅ Test payment flows with mock Stripe
- ✅ Test file uploads with mock storage
- ✅ Verify database operations
- ✅ Test all user interfaces and workflows

## 🚀 Quick Start

### Option 1: Automated Test Mode (Recommended)

**Windows:**
```bash
npm run test:start:windows
```

**Linux/Mac:**
```bash
npm run test:start
```

This will:
1. Set up test environment automatically
2. Start the development server
3. Open your browser to the application
4. Display available test features

### Option 2: Manual Setup

1. **Copy test environment:**
   ```bash
   cp .env.test .env.local
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

## 🔧 Mock Services Available

### 1. Mock Authentication
- **Provider:** Mock Twitter OAuth
- **Test Users:** 
  - Free user: `test@example.com`
  - Premium user: `premium@example.com`
- **Login:** Use any email address to create a test session

### 2. Mock AI Try-On Service
- **Processing Time:** 2-3 seconds (simulated)
- **Success Rate:** ~80% (configurable)
- **Test Scenarios:**
  - Normal images → Success with generated result
  - Images with "error" in URL → Simulated failure
  - Images with "lowquality" in URL → Quality error

### 3. Mock Payment System
- **Provider:** Mock Stripe
- **Test Cards:** All transactions succeed in test mode
- **Subscriptions:** Automatically activated
- **Webhooks:** Simulated webhook events

### 4. Mock File Upload
- **Storage:** Mock Vercel Blob
- **Validation:** File type and size checks
- **URLs:** Generated placeholder URLs
- **Processing:** Instant upload simulation

## 🧪 Running Integration Tests

### Automated Test Suite

Run the complete integration test suite:

```bash
npm run test:integration
```

This tests:
- ✅ Application health check
- ✅ Glasses frames API
- ✅ File upload API
- ✅ AI try-on API
- ✅ Payment API
- ✅ Database operations

### Manual Testing Workflows

#### 1. User Registration & Authentication
1. Go to `/auth/signin`
2. Use mock credentials provider
3. Enter any email address
4. Verify user session and dashboard access

#### 2. Glasses Try-On Workflow
1. Upload a user photo (any image file)
2. Select a glasses frame
3. Start try-on process
4. Wait for mock AI processing
5. View generated result

#### 3. Payment & Subscription
1. Go to `/pricing`
2. Select a premium plan
3. Complete mock checkout
4. Verify premium status activation

#### 4. Sharing & Social Features
1. Complete a try-on
2. Share the result
3. Test public sharing URLs
4. Verify social media integration

## 📊 Test Data

### Mock Users
```javascript
// Free User
{
  email: "test@example.com",
  name: "Test User",
  freeTrialsUsed: 1,
  isPremium: false
}

// Premium User  
{
  email: "premium@example.com",
  name: "Premium User",
  freeTrialsUsed: 0,
  isPremium: true
}
```

### Mock Glasses Frames
- Classic Black Frame (Rectangle)
- Round Vintage (Round)
- Cat Eye Chic (Cat Eye)

### Mock Try-On Results
- Success scenarios with generated images
- Error scenarios for testing error handling
- Various processing times for UX testing

## 🔍 Debugging Test Mode

### Check Mock Mode Status
```javascript
// In browser console
console.log('Mock mode:', process.env.ENABLE_MOCKS)
```

### View Mock Data
```javascript
// Access mock data in browser
import { mockUsers, mockGlassesFrames } from '/src/lib/mocks'
```

### Test Logs
Mock services log all operations to console:
- 🧪 Mock AI Service operations
- 💳 Mock Stripe transactions
- 📁 Mock file uploads
- 🔍 Mock authentication events

## 📋 Test Checklist

### Core Functionality
- [ ] Homepage loads correctly
- [ ] User authentication works
- [ ] Glasses frames load and display
- [ ] Image upload functions
- [ ] Try-on process completes
- [ ] Results display properly
- [ ] Payment flow works
- [ ] User dashboard accessible
- [ ] Sharing features work
- [ ] Public profiles display

### Error Handling
- [ ] Invalid file uploads rejected
- [ ] Network errors handled gracefully
- [ ] Authentication failures managed
- [ ] Payment errors displayed
- [ ] Try-on failures reported

### User Experience
- [ ] Loading states display
- [ ] Success messages shown
- [ ] Error messages clear
- [ ] Navigation works smoothly
- [ ] Mobile responsive design
- [ ] Accessibility features

## 🚀 Production Readiness

After all tests pass:

1. **Replace mock services** with real API keys
2. **Configure production database**
3. **Set up real authentication providers**
4. **Configure payment processing**
5. **Set up file storage**
6. **Deploy to production environment**

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3000 is available
- Verify .env.test file exists
- Clear .next directory and restart

**Tests failing:**
- Ensure server is running
- Check console for error messages
- Verify mock mode is enabled

**Mock services not working:**
- Check ENABLE_MOCKS environment variable
- Verify import paths in mock files
- Check browser console for errors

### Getting Help

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all mock files are properly imported
3. Ensure test environment variables are set correctly
4. Review the integration test results for specific failures

## 📈 Next Steps

Once testing is complete:
- Review test results and fix any issues
- Prepare production environment configuration
- Set up monitoring and analytics
- Plan deployment strategy
- Configure CI/CD pipeline for automated testing

# VisuTry - AI-Powered Virtual Glasses Try-On

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/franksunye/VisuTry/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black.svg)](https://vercel.com)

VisuTry is a cutting-edge AI-powered virtual glasses try-on application that allows users to upload their photos and custom glasses images to preview how different eyewear looks on them using advanced AI technology.

## ✨ Features

- 🤖 **AI Try-On Technology**: Powered by Google Gemini 2.5 Flash Image model for realistic virtual try-on
- 👤 **User Authentication**: Secure Twitter OAuth login with NextAuth.js
- 💳 **Payment System**: Integrated Stripe payment with free trials and premium plans
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices
- 🔗 **Social Sharing**: Generate shareable links for social media platforms
- 📊 **User Dashboard**: Personal history, usage statistics, and account management
- 🖼️ **Custom Upload**: Upload both user photos and custom glasses images
- ⚡ **Real-time Processing**: Asynchronous AI processing with live status updates

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Twitter OAuth)
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Service**: Google Gemini 2.5 Flash Image

### Deployment
- **Platform**: Vercel
- **Database**: Neon PostgreSQL
- **CDN**: Vercel Edge Network
- **Version Control**: Git with semantic versioning

## 📁 Project Structure

```
VisuTry/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   ├── auth/       # Authentication endpoints
│   │   │   ├── try-on/     # Try-on processing endpoints
│   │   │   ├── payment/    # Stripe payment endpoints
│   │   │   └── upload/     # File upload endpoints
│   │   ├── dashboard/      # User dashboard pages
│   │   ├── share/          # Public sharing pages
│   │   └── try-on/         # Try-on interface pages
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── auth/          # Authentication components
│   │   ├── upload/        # File upload components
│   │   ├── try-on/        # Try-on interface components
│   │   ├── dashboard/     # Dashboard components
│   │   └── share/         # Sharing components
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── prisma.ts      # Prisma client
│   │   ├── stripe.ts      # Stripe configuration
│   │   └── gemini.ts      # Gemini AI client
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── prisma/                # Database schema and migrations
├── scripts/               # Build and release scripts
├── tests/                 # Test suites
├── docs/                  # Project documentation
└── public/                # Static assets
```

## 🚀 Quick Start

### Demo Mode (Recommended)
Experience all features instantly without any API keys:

```bash
# 1. Clone the repository
git clone https://github.com/franksunye/VisuTry.git
cd VisuTry

# 2. Install dependencies
npm install

# 3. Start in demo mode
npm run test:start:windows  # Windows
npm run test:start          # Linux/Mac

# Or manually start demo mode
cp .env.test .env.local && npm run dev
```

Visit http://localhost:3000 to start using the application

### Production Mode
For production deployment with real API services, see `docs/development-guide.md`

### Development Mode
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests with Playwright
npm run test:e2e:playwright

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 📊 Current Status

- ✅ **Version**: v0.2.0 - Version Management System
- ✅ **Core Features**: MVP completed with all major features
- ✅ **Testing**: Comprehensive test suite with 89% pass rate
- ✅ **Deployment**: Production-ready on Vercel
- 🎯 **Next**: UI optimization and prompt improvements (v0.3.0)

## 🔄 How It Works

1. **User Authentication**: Sign in with Twitter OAuth
2. **Upload Images**: Upload your photo and custom glasses image
3. **AI Processing**: Gemini 2.5 Flash Image model processes the virtual try-on
4. **Real-time Updates**: Monitor processing status with live updates
5. **View Results**: See the AI-generated try-on result
6. **Share & Save**: Share results on social media or save to history

## 🎯 Version Management

This project uses semantic versioning and automated release management:

```bash
# Create a new release
npm run release

# Version-specific releases
npm run release:patch  # Bug fixes (0.2.0 → 0.2.1)
npm run release:minor  # New features (0.2.0 → 0.3.0)
npm run release:major  # Breaking changes (0.2.0 → 1.0.0)
```

See `docs/VERSION_MANAGEMENT.md` for detailed guidelines.

## 📚 Documentation

- [`docs/architecture.md`](docs/architecture.md) - Project architecture and features
- [`docs/development-guide.md`](docs/development-guide.md) - Production setup guide
- [`docs/testing-guide.md`](docs/testing-guide.md) - Testing instructions
- [`docs/VERSION_MANAGEMENT.md`](docs/VERSION_MANAGEMENT.md) - Version management guide
- [`docs/RELEASE_GUIDE.md`](docs/RELEASE_GUIDE.md) - Quick release reference
- [`CHANGELOG.md`](CHANGELOG.md) - Version history and changes

## 🚀 Deployment

The application is deployed on Vercel with automatic deployments from the main branch.

### Environment Variables
Required for production:
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `TWITTER_CLIENT_ID` - Twitter OAuth client ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth client secret
- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Project Repository**: [https://github.com/franksunye/VisuTry](https://github.com/franksunye/VisuTry)
- **Issues**: [GitHub Issues](https://github.com/franksunye/VisuTry/issues)
- **Discussions**: [GitHub Discussions](https://github.com/franksunye/VisuTry/discussions)

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI image generation
- [Vercel](https://vercel.com/) for hosting and deployment
- [Stripe](https://stripe.com/) for payment processing
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Prisma](https://www.prisma.io/) for database management

---

**Built with ❤️ using Next.js and AI technology**

# VisuTry - AI-Powered Virtual Glasses Try-On

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/franksunye/VisuTry/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Vercel](https.img.shields.io/badge/deployed%20on-Vercel-black.svg)](https://vercel.com)

VisuTry is a cutting-edge AI-powered virtual glasses try-on application. It allows users to upload their photos and custom glasses images to preview how different eyewear looks on them using advanced AI technology.

## ✨ Features

- 🤖 **AI Try-On Technology**: Realistic virtual try-on powered by Google Gemini 2.5 Flash.
- 👤 **User Authentication**: Secure authentication with Auth0, supporting Google, Twitter, and more.
- 💳 **Payment System**: Integrated with Stripe for free trials and premium plans.
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices.
- 🔗 **Social Sharing**: Generate shareable links for your try-on results.
- 📊 **User Dashboard**: Manage your try-on history, usage statistics, and account settings.
- 🖼️ **Custom Uploads**: Upload your own photos and glasses images.
- ⚡ **Real-time Processing**: Asynchronous AI processing with live status updates.
- ⚖️ **Legal Compliance**: Includes a privacy policy, terms of service, and refund policy.

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js + Auth0
- **Payment**: Stripe
- **File Storage**: Vercel Blob
- **AI Service**: Google Gemini 2.5 Flash

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
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   └── ...
├── prisma/                # Database schema and migrations
├── docs/                  # Project documentation
└── ...
```

## 🚀 Quick Start

### Demo Mode (Recommended)

Experience all features instantly without any API keys.

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/franksunye/VisuTry.git
    cd VisuTry
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start in demo mode**:
    ```bash
    # For Windows
    npm run test:start:windows

    # For Linux/Mac
    npm run test:start
    ```

    Alternatively, you can manually start the demo mode by running `cp .env.test .env.local && npm run dev`.

Visit [http://localhost:3000](http://localhost:3000) to start using the application.

### Production & Development

For production deployment and local development with real API services, please refer to the [Development Guide](docs/guides/development-guide.md).

## 🔄 How It Works

1. **User Authentication**: Sign in with your preferred OAuth provider.
2. **Upload Images**: Upload your photo and a custom glasses image.
3. **AI Processing**: The Gemini AI model processes the virtual try-on.
4. **Real-time Updates**: Monitor the processing status with live updates.
5. **View & Share**: View the AI-generated result and share it on social media.

## 🧪 Testing

This project includes a comprehensive test suite. For detailed instructions, see the [Testing Guide](docs/guides/testing-guide.md).

```bash
# Run all tests
npm test
```

## 📚 Documentation

- [Project Architecture](docs/project/architecture.md)
- [Development Guide](docs/guides/development-guide.md)
- [Testing Guide](docs/guides/testing-guide.md)
- [Version Management](docs/guides/version-management.md)
- [Changelog](CHANGELOG.md)

## 🚀 Deployment

The application is deployed on Vercel. For a full list of required environment variables for production, see the [Development Guide](docs/guides/development-guide.md).

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the repository.
2.  Create a new feature branch.
3.  Commit your changes following the [Conventional Commits](https://www.conventionalcommits.org/) specification.
4.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
```
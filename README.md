# 🚀 SearchCenter Live

A comprehensive knowledge discovery platform with advanced search capabilities, user management, and AI-powered features.

## 🌟 Features

### 🔍 Advanced Search
- **Multi-Source Search**: Google, Perplexity, Edge integration
- **Content Types**: Code, Videos, Datasets, Research Papers
- **Smart Filtering**: Language, date, popularity, and custom filters
- **Real-time Results**: Instant search with intelligent ranking

### 👤 User Management
- **Seamless Authentication**: Clerk-powered signup/signin flow
- **Personal Profiles**: User preferences, skills, and social links
- **Gamification**: Points, levels, badges, and achievements
- **Behavior Tracking**: Search history and personalized recommendations

### 💳 Subscription System
- **Three Tiers**: Free (₹0), Pro (₹39/mo), Ultra (₹99/mo)
- **Razorpay Integration**: Indian market payment processing
- **Usage Limits**: Tiered access to features and API calls
- **Flexible Billing**: Monthly and yearly options with savings

### 🤖 AI-Powered Features
- **Gemini Integration**: AI-powered project suggestions
- **Resource Combination**: Intelligent resource matching
- **Learning Paths**: Personalized project roadmaps
- **Content Analysis**: Semantic search and relevance scoring

### 🎛️ Admin Dashboard
- **Complete Control**: User management, subscriptions, payments
- **Real-time Analytics**: Search metrics, user behavior, performance
- **System Monitoring**: Health checks, error tracking, alerts
- **Notification System**: Email and in-app notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 8+
- Git

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/searchcenter-live.git
   cd searchcenter-live
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure your API keys
   nano .env
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

### Environment Variables

Required variables for basic functionality:

```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_SECRET_KEY=your_clerk_secret_key
VITE_ADMIN_EMAIL=msnithin84@gmail.com

# Database
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MONGODB_URI=your_mongodb_connection_string

# Search APIs
VITE_GOOGLE_SEARCH_API_KEY=your_google_search_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Payment Gateway
VITE_RAZORPAY_KEY=your_razorpay_key_id
VITE_RAZORPAY_SECRET=your_razorpay_key_secret
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Add all environment variables from `.env`

### Netlify

1. **Install Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure Environment Variables**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Add environment variables in Site settings

### Docker

1. **Build Image**
   ```bash
   docker build -t searchcenter-live .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 searchcenter-live
   ```

## 📁 Project Structure

```
SearchCenter-live/
├── src/
│   ├── components/           # React components
│   │   ├── AdminDashboard.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── AdminNotifications.tsx
│   │   ├── ServiceIntegrationTester.tsx
│   │   └── ...other components
│   ├── services/            # Backend services
│   │   ├── envConfig.ts
│   │   ├── adminNotificationService.ts
│   │   ├── searchAnalyticsService.ts
│   │   ├── serviceIntegration.ts
│   │   └── ...other services
│   ├── config/              # Configuration files
│   ├── styles/              # CSS and styling
│   └── utils/               # Utility functions
├── api/                     # Vercel serverless functions
├── netlify/functions/        # Netlify serverless functions
├── public/                  # Static assets
├── dist/                    # Build output
├── .env.example            # Environment template
├── DEPLOYMENT.md           # Deployment guide
└── IMPLEMENTATION_COMPLETE.md # Feature documentation
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # TypeScript type checking
npm run build:analyze    # Analyze bundle size
npm run lint             # Run ESLint

# Testing
npm run test             # Run tests (when implemented)
npm run test:watch       # Run tests in watch mode
```

## 🔧 Configuration

### Admin Access
- Default admin email: `msnithin84@gmail.com`
- Access admin dashboard via user menu
- Full platform management capabilities

### Subscription Plans
- **Free**: Limited search, basic features
- **Pro (₹39/mo)**: Extended search limits, AI features
- **Ultra (₹99/mo)**: Unlimited access, premium features

### API Integrations
- **Google Search**: Primary search functionality
- **Gemini AI**: AI-powered suggestions and analysis
- **Razorpay**: Payment processing (Indian market)
- **Clerk**: Authentication and user management
- **Supabase**: Real-time database
- **MongoDB**: Analytics and user data

## 📊 Analytics & Monitoring

### Built-in Analytics
- Search query tracking
- User behavior analysis
- Performance metrics
- Error monitoring
- System health checks

### Admin Dashboard
- Real-time statistics
- User management
- Subscription oversight
- Payment tracking
- System settings

## 🔐 Security

### Authentication
- Clerk-powered secure authentication
- Email verification required
- Session management
- Social login options

### Data Protection
- Environment variables for sensitive data
- HTTPS enforced in production
- CORS configuration
- Input validation and sanitization

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support:
- **Admin Email**: msnithin84@gmail.com
- **Documentation**: See [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Integration Testing**: Use Service Integration Tester in admin panel

## 🎉 Acknowledgments

- **Vite**: Build tool and development server
- **React**: UI framework
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Lucide React**: Icon library
- **Clerk**: Authentication provider
- **Supabase**: Real-time database
- **Razorpay**: Payment gateway

---

**🚀 Built with ❤️ for the knowledge discovery community**
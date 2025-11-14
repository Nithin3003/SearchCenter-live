# 🚀 SearchCenter Live Deployment Guide

Complete guide for deploying SearchCenter Live to Vercel and Netlify with production-ready configuration.

---

## 📋 Prerequisites

### Required Services
- **Clerk**: User authentication and management
- **Supabase**: Real-time database and backend
- **MongoDB**: Analytics and user data storage
- **Razorpay**: Payment processing (for Indian market)
- **Google Search API**: Search functionality
- **Gemini AI**: AI-powered features

### Optional Services
- **EmailJS**: Admin notifications
- **AWS S3/Cloudinary**: File storage
- **Google Analytics**: Usage analytics
- **Sentry**: Error tracking

---

## 🛠️ Pre-Deployment Setup

### 1. Environment Configuration
```bash
# Copy production environment template
cp .env.production .env.local

# Edit with your actual API keys
nano .env.local
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build for Production
```bash
npm run build
```

### 4. Test Build Locally
```bash
npm run preview
```

---

## 🚀 Vercel Deployment

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod

# Configure environment variables in Vercel dashboard
# Copy values from .env.local
```

### Method 2: Vercel Dashboard
1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_CLERK_SECRET_KEY=your_clerk_secret_key
   VITE_ADMIN_EMAIL=msnithin84@gmail.com
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MONGODB_URI=your_mongodb_uri
   VITE_RAZORPAY_KEY=your_razorpay_key
   VITE_RAZORPAY_SECRET=your_razorpay_secret
   VITE_GOOGLE_SEARCH_API_KEY=your_google_search_api_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   ```

4. **Deploy**
   - Push to main branch to trigger automatic deployment
   - Or use "Deployments" tab for manual deployment

### Vercel Configuration
The `vercel.json` file includes:
- ✅ Optimized build configuration
- ✅ Environment variable structure
- ✅ Caching headers for performance
- ✅ URL rewrites for SPA routing
- ✅ Regional deployment (IAD1)

---

## 🌐 Netlify Deployment

### Method 1: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Method 2: Netlify Dashboard
1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add all variables from `.env.production`

4. **Configure Redirects**
   - Use the provided `netlify.toml` for automatic configuration
   - Includes SPA routing and API redirects

### Netlify Configuration
The `netlify.toml` file includes:
- ✅ Build optimization
- ✅ SPA routing support
- ✅ API endpoint handling
- ✅ Caching headers
- ✅ Edge function configuration

---

## 🔧 Post-Deployment Configuration

### 1. Verify Environment
```bash
# Access your deployed application
curl https://your-domain.vercel.app

# Check admin panel (requires msnithin84@gmail.com)
# Navigate to /admin or look for admin access
```

### 2. Test Integration
1. **Authentication**: Test user signup/login flow
2. **Search**: Verify search functionality works
3. **Admin Panel**: Access admin features with configured email
4. **Payments**: Test Razorpay integration (in test mode first)
5. **Notifications**: Verify admin notifications work

### 3. Configure Webhooks
```bash
# Razorpay Webhook
POST https://your-domain.vercel.app/api/webhooks/razorpay
Headers: X-Razorpay-Signature

# Clerk Webhooks (if needed)
POST https://your-domain.vercel.app/api/webhooks/clerk
```

---

## 🚨 Production Checklist

### Security
- [ ] All environment variables set in deployment platform
- [ ] CORS configured for your domain
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Admin access restricted to `msnithin84@gmail.com`
- [ ] API keys secured and not exposed in client code

### Performance
- [ ] Build optimization enabled
- [ ] Caching headers configured
- [ ] Code splitting implemented
- [ ] Image optimization configured
- [ ] CDN enabled for static assets

### Functionality
- [ ] User authentication works
- [ ] Search functionality operational
- [ ] Admin dashboard accessible
- [ ] Payment integration functional
- [ ] Email notifications working
- [ ] Analytics tracking active

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Analytics tracking active (Google Analytics)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Log collection active

---

## 🌍 Environment Variables Reference

### Required for Basic Functionality
```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
VITE_CLERK_SECRET_KEY=sk_live_your_key
VITE_ADMIN_EMAIL=msnithin84@gmail.com

# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MONGODB_URI=mongodb+srv://...

# Search & AI
VITE_GOOGLE_SEARCH_API_KEY=AIzaSy_your_key
VITE_GEMINI_API_KEY=AIzaSy_your_key
```

### Required for Full Features
```bash
# Payments
VITE_RAZORPAY_KEY=rzp_live_your_key
VITE_RAZORPAY_SECRET=your_secret

# Notifications
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

---

## 🛠️ Build & Deployment Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "build:analyze": "vite build --mode analyze"
  }
}
```

### Build Configuration
- **Output Directory**: `dist/`
- **Source Maps**: Enabled for debugging
- **Code Splitting**: Optimized for production
- **Asset Optimization**: Automatic minification
- **Environment**: Production mode with proper variables

---

## 🔍 Testing & Validation

### Pre-Deployment Tests
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build

# Local preview
npm run preview
```

### Post-Deployment Validation
1. **Load Application**: Check if main page loads
2. **Authentication**: Test user signup/login
3. **Admin Access**: Verify admin dashboard works
4. **Search**: Test search functionality
5. **Responsive**: Test on mobile devices
6. **Performance**: Check load times
7. **Error Handling**: Verify error pages work

---

## 📈 Performance Optimization

### Vercel Optimizations
- ✅ Automatic CDN distribution
- ✅ Edge caching enabled
- ✅ Build optimization
- ✅ Asset compression
- ✅ Regional deployment

### Netlify Optimizations
- ✅ Global CDN
- ✅ Edge functions for API routes
- ✅ Asset optimization
- ✅ Automatic HTTPS
- ✅ Build caching

### Application Optimizations
- ✅ Code splitting by route
- ✅ Lazy loading for components
- ✅ Optimized bundle sizes
- ✅ Tree shaking enabled
- ✅ Image optimization
- ✅ Service worker for caching

---

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Build Failures**: Check environment variables and Node.js version
2. **API Errors**: Verify API keys and CORS settings
3. **Payment Issues**: Check Razorpay test vs live mode
4. **Admin Access**: Ensure email is set to `msnithin84@gmail.com`

### Monitoring
- **Vercel**: Dashboard logs and analytics
- **Netlify**: Build logs and site overview
- **Application**: Built-in analytics dashboard
- **Errors**: Check browser console and network tab

### Performance Monitoring
- Use the built-in Service Integration Tester
- Check the Analytics Dashboard for performance metrics
- Monitor error rates and response times
- Set up alerts for critical issues

---

## 🎯 Deployment URLs

After successful deployment:
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app`
- **Custom Domain**: Configure in respective dashboard

### Next Steps
1. **Configure Custom Domain**: Add your domain in deployment platform
2. **Set up DNS**: Update DNS records if using custom domain
3. **SSL Certificate**: Automatic on both platforms
4. **Analytics Setup**: Configure Google Analytics if needed
5. **Monitor Performance**: Set up uptime monitoring

---

## 🎉 Success!

Your SearchCenter Live application is now ready for production deployment on Vercel or Netlify with:

✅ **Optimized Build**: Production-ready with code splitting
✅ **Environment Configuration**: All variables properly configured
✅ **Security**: CORS, HTTPS, and secure variable handling
✅ **Performance**: CDN, caching, and optimization enabled
✅ **Monitoring**: Built-in analytics and error tracking
✅ **Admin Features**: Complete admin dashboard for management

🚀 **Deploy now and enjoy your SearchCenter Live application!**
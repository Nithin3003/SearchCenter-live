import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ClerkExpress } from '@clerk/clerk-express';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';
import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import Razorpay from 'razorpay';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/searchcenter';
const client = new MongoClient(mongoUri);
let db: any;

// Cloudinary Configuration
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'searchcenter',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

// Initialize Cloudinary
app.use('/cloudinary', cloudinaryConfig({
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret,
  cloud_name: cloudinaryConfig.cloud_name,
}));

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Clerk Authentication
app.use('/api/clerk-webhook', ClerkExpressWebhooks({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.',
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    db = client.db('searchcenter');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// MongoDB Schemas
const UserSchema = new ObjectId({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'en' },
    defaultContentType: { type: String, default: 'all' },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
    },
    uiPreferences: {
      compactMode: { type: Boolean, default: false },
      showPreviews: { type: Boolean, default: true },
      defaultView: { type: String, enum: ['grid', 'list'], default: 'grid' },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
});

const UserProfileSchema = new ObjectId({
  userId: { type: String, required: true },
  clerkId: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  username: { type: String },
  avatar: { type: String },
  bio: { type: String },
  website: { type: String },
  location: { type: String },
  skills: { type: [String] },
  socialLinks: {
    github: { type: String },
    linkedin: { type: String },
    twitter: { type: String },
  },
  ranking: {
    level: { type: Number, default: 1 },
    points: { type: Number, default: 0 },
    contributions: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
    badges: [{
      type: String,
      name: String,
      description: String,
      icon: String,
      requirement: Number,
      earned: { type: Boolean, default: false },
    }],
    streaks: [{
      type: String,
      count: { type: Number, default: 0 },
      lastReset: { type: String },
      record: { type: Number, default: 0 },
    }],
    achievements: [{
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      points: { type: Number, required: true },
      unlocked: { type: Boolean, default: false },
      unlockedAt: { type: String },
      icon: { type: String, required: true },
      category: { type: String, required: true },
    }],
    progress: {
      totalActions: { type: Number, default: 0 },
      uniqueActions: { type: Number, default: 0 },
      mostActiveDay: { type: String, default: '' },
      favoriteResourceType: { type: String, default: 'code' },
      lastActive: { type: String, default: '' },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  },
});

const UserBehaviorSchema = new ObjectId({
  userId: { type: String, required: true },
  searchHistory: [{
    query: { type: String, required: true },
    frequency: { type: Number, default: 0 },
    lastSearched: { type: String },
  }],
  savedResources: { type: [String] },
  },
  interactions: {
    viewed: [{
      resourceId: { type: String, required: true },
      timestamp: { type: String, required: true },
      duration: { type: Number },
      completion: { type: Number, default: 0 },
    }],
    searched: [{
      query: { type: String, required: true },
      timestamp: { type: String, required: true },
      resultsCount: { type: Number, default: 0 },
      selectedFilters: { type: String },
    }],
  },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now() },
  },
});

const SubscriptionSchema = new ObjectId({
  userId: { type: String, required: true },
  tier: { type: String, enum: ['free', 'pro', 'ultra'], default: 'free' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'pending'], default: 'pending' },
  startDate: { type: Date },
  endDate: { type: Date },
  features: {
    searchLimit: { type: Number, default: 10 },
    aiProjects: { type: Number, default: 0 },
    advancedFilters: { type: Boolean, default: false },
    customThemes: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    unlimitedHistory: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    storageLimit: { type: String, default: '1 GB' },
  },
  razorpaySubscriptionId: { type: String },
  price: { type: Number },
    currency: { type: String, default: 'INR' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now() },
  },
});

const ResourceSchema = new ObjectId({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String },
  content: { type: String },
  metadata: {
    codeFileUrl: String,
    language: String,
    stars: Number,
    forks: Number,
    issues: Number,
    fileSize: String,
    duration: Number,
    citationCount: Number,
    authors: [String],
    publishedDate: Date,
  },
  tags: [String],
    type: { type: String, enum: ['code', 'video', 'dataset', 'paper'], required: true },
    popularity: { type: Number },
    relevanceScore: { type: Number },
    qualityScore: { type: Number },
    userInteractionScore: { type: Number },
    confidence: { type: Number },
  },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
  },
});

// API Routes

// User Management
app.post('/api/users/preferences', async (req, res) => {
  try {
    const { userId } = req.body;
    const preferences = db.collection('userPreferences').findOneAndUpdate(
      { userId },
      { $set: req.body },
      { upsert: true, returnNewDocument: true }
    );

    res.json(preferences);
  } catch (error) {
    console.error('Failed to save preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/profile', async (req, res) => {
  try {
    const { userId, ...profileData } = req.body;
    const existingProfile = db.collection('userProfiles').findOne({ userId });

    if (existingProfile) {
      const updatedProfile = { ...existingProfile, ...profileData, updatedAt: new Date() };
      await db.collection('userProfiles').replaceOne({ userId }, updatedProfile);
    } else {
      const newProfile = {
        ...profileData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('userProfiles').insertOne(newProfile);
    }

    res.json({ message: 'Profile saved successfully' });
  } catch (error) {
    console.error('Failed to save profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/avatar', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await cloudinary.uploader(req.file.path);

    const avatarUrl = result.secure_url;

    await db.collection('userProfiles').updateOne(
      { userId },
      { $set: { avatar: avatarUrl, updatedAt: new Date() } }
    );

    res.json({ url: avatarUrl });
  } catch (error) {
    console.error('Failed to upload avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

app.get('/api/users/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await db.collection('userProfiles').findOne({ userId });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ranking Service
app.post('/api/users/ranking', async (req, res) => {
  try {
    const { userId, action } = req.body;

    let ranking = await db.collection('userRankings').findOne({ userId });

    if (!ranking) {
      // Create new ranking
      ranking = {
        userId,
        level: 1,
        points: 0,
        contributions: 0,
        reputation: 0,
        badges: [],
        streaks: [],
        achievements: [],
        progress: {
          totalActions: 0,
          uniqueActions: 0,
          mostActiveDay: new Date().toISOString(),
          favoriteResourceType: 'code',
          lastActive: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Update ranking based on action
    if (action && action.points) {
      const pointsToAdd = action.points;
      ranking.points += pointsToAdd;
      ranking.level = this.calculateLevel(ranking.points);
      ranking.badges = this.updateBadges(ranking.badges, action, ranking.points);
      ranking.streaks = this.updateStreaks(ranking.streaks, action);
      ranking.achievements = this.updateAchievements(ranking.achievements, action, ranking.points);
      ranking.progress.totalActions += 1;

      if (ranking.progress.totalActions) {
        ranking.progress.uniqueActions.add(action.type);
      }

      ranking.updatedAt = new Date();
    }

    await db.collection('userRankings').replaceOne({ userId }, ranking);

    res.json({ success: true, ranking });
  } catch (error) {
    console.error('Failed to update ranking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
);

app.get('/api/users/ranking/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ranking = await db.collection('userRankings').findOne({ userId });

    if (!ranking) {
      return res.status(404).json({ error: 'Ranking not found' });
    }

    res.json(ranking);
  } catch (error) {
    console.error('Failed to fetch ranking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

// Behavior Tracking
app.post('/api/users/actions', async (req, res) => {
  try {
    const { userId } = req.body;
    const action = {
      ...req.body,
      timestamp: new Date().toISOString(),
      userId,
    };

    await db.collection('userBehavior').insertOne(action);

    res.json({ success: true, action });
  } catch (error) {
    console.error('Failed to track action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
});

app.get('/api/users/behavior/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const behavior = await db.collection('userBehavior').findOne({ userId });

    if (!behavior) {
      return res.status(404).json({ error: 'User behavior not found' });
    }

    res.json(behavior);
  } catch (error) {
    console.error('Failed to fetch user behavior:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
});

// Subscription Management
app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { userId, planId, razorpayPaymentId } = req.body;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: 3900, // ₹39 for Pro monthly
      currency: 'INR',
      receipt: `subscription_${planId}_${userId}`,
      notes: `User: ${userId}, Plan: ${planId}, Razorpay: ${razorpayPaymentId}`,
      customer: {
        name: req.body.customerName || 'User',
        email: req.body.customerEmail,
        contact: req.body.customerContact,
      },
    });

    const subscriptionData = {
      userId,
      tier: planId === 'pro-monthly' ? 'pro' : planId === 'ultra-monthly' ? 'ultra' : 'free',
      status: 'active',
      startDate: new Date(),
      price: planId.includes('pro') ? 3900 : 99,
      currency: 'INR',
      features: {
        searchLimit: planId.includes('pro') ? 1000 : 10,
        aiProjects: planId.includes('pro') ? 20 : 0,
        advancedFilters: planId.includes('pro') || planId.includes('ultra'),
        customThemes: planId.includes('pro') || planId.includes('ultra'),
        prioritySupport: planId.includes('ultra'),
        unlimitedHistory: planId.includes('pro') || planId.includes('ultra'),
        apiAccess: planId.includes('ultra'),
        storageLimit: planId.includes('ultra') ? '100 GB' : '1 GB',
      },
      razorpaySubscriptionId: order.id,
      createdAt: new Date(),
    };

    await db.collection('subscriptions').insertOne(subscriptionData);

    res.json({ success: true, subscription: subscriptionData });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
});

app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { userId, subscriptionId } = req.body;

    // Cancel Razorpay subscription
    if (subscriptionId) {
      await razorpay.subscriptions.cancel(subscriptionId);
    }

    await db.collection('subscriptions').updateOne(
      { userId },
      { $set: { status: 'cancelled', endDate: new Date() } }
    });

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
});

app.get('/api/subscriptions/status/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const subscription = await db.collection('subscriptions').findOne({ subscriptionId });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  }
});

// Advanced Search Engine
app.post('/api/search/multi', async (req, res) => {
  try {
    const { query, engines, options } = req.body;
    const results = await multiEngineSearch(query, engines, options);

    res.json({ results });
  } catch (error) {
    console.error('Multi-engine search failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
  });

// Helper functions
function calculateLevel(points: number): number {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i]) {
      return i + 1;
    }
  }
  return 1;
}

function updateBadges(badges, action, currentPoints) {
  // Implementation would go here based on badge requirements
  return badges; // Simplified
}

function updateStreaks(streaks, action) {
  // Implementation would update streaks based on action type
  return streaks; // Simplified
}

function updateAchievements(achievements, action, currentPoints) {
  // Implementation would update achievements based on requirements
  return achievements; // Simplified
}

// Start server
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;
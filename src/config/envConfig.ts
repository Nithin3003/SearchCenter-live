/**
 * Environment Configuration Service
 * Centralized configuration management for SearchCenter Live platform
 */

export interface AppConfig {
  // Authentication
  auth: {
    clerk: {
      publishableKey: string;
      secretKey: string;
    };
    admin: {
      email: string;
      name: string;
      role: string;
    };
  };

  // API Services
  apis: {
    google: {
      searchApiKey: string;
      searchEngineId: string;
      oauthClientId: string;
    };
    perplexity: {
      apiKey: string;
    };
    bing: {
      apiKey: string;
    };
    github: {
      token: string;
      clientId: string;
      clientSecret: string;
      oauthClientId: string;
    };
    youtube: {
      apiKey: string;
    };
    kaggle: {
      username: string;
      key: string;
    };
    semanticScholar: {
      apiKey: string;
    };
  };

  // AI & ML Services
  ai: {
    gemini: {
      apiKey: string;
      model: string;
    };
    openai?: {
      apiKey: string;
      model: string;
    };
  };

  // Database & Storage
  database: {
    supabase: {
      url: string;
      anonKey: string;
      serviceRoleKey: string;
    };
    mongodb: {
      uri: string;
      dbName: string;
    };
    redis?: {
      url: string;
      password: string;
    };
  };

  // Payment & Subscriptions
  payment: {
    razorpay: {
      key: string;
      secret: string;
      webhookSecret: string;
    };
    plans: {
      pro: {
        monthly: number;
        yearly: number;
      };
      ultra: {
        monthly: number;
        yearly: number;
      };
    };
  };

  // Notification & Communication
  notifications: {
    emailjs: {
      serviceId: string;
      templateId: string;
      publicKey: string;
    };
    smtp?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
  };

  // File Storage & CDN
  storage: {
    aws?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      s3Bucket: string;
      cdnUrl: string;
    };
    cloudinary?: {
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    };
  };

  // Analytics & Monitoring
  analytics: {
    googleAnalytics?: {
      measurementId: string;
    };
    sentry?: {
      dsn: string;
    };
    logRocket?: {
      appId: string;
    };
  };

  // Security & Rate Limiting
  security: {
    jwt: {
      secret: string;
      expiresIn: string;
    };
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      allowedOrigins: string[];
    };
    recaptcha: {
      siteKey: string;
      secretKey: string;
    };
    emailVerification: {
      required: boolean;
      tokenExpires: string;
    };
  };

  // Search & Content Configuration
  search: {
    defaultLimit: number;
    maxLimit: number;
    cacheTTL: number;
    defaultLanguage: string;
    supportedLanguages: string[];
  };

  // Development & Deployment
  deployment: {
    appUrl: string;
    apiBaseUrl: string;
    backendUrl: string;
    nodeEnv: string;
    logLevel: string;
    port: number;
  };

  // Social OAuth
  social: {
    google: {
      oauthClientId: string;
    };
    github: {
      oauthClientId: string;
    };
    microsoft?: {
      oauthClientId: string;
    };
  };

  // Feature Flags
  features: {
    enableAIFeatures: boolean;
    enableAdvancedSearch: boolean;
    enableSocialFeatures: boolean;
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableSubscriptions: boolean;
    enableAdminPanel: boolean;
    enableBetaFeatures: boolean;
    enableExperimentalAI: boolean;
  };
}

class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): AppConfig {
    return {
      auth: {
        clerk: {
          publishableKey: this.getEnvVar('VITE_CLERK_PUBLISHABLE_KEY'),
          secretKey: this.getEnvVar('VITE_CLERK_SECRET_KEY'),
        },
        admin: {
          email: this.getEnvVar('VITE_ADMIN_EMAIL'),
          name: this.getEnvVar('VITE_ADMIN_NAME', 'Admin'),
          role: this.getEnvVar('VITE_ADMIN_ROLE', 'super_admin'),
        },
      },

      apis: {
        google: {
          searchApiKey: this.getEnvVar('VITE_GOOGLE_SEARCH_API_KEY'),
          searchEngineId: this.getEnvVar('VITE_GOOGLE_SEARCH_ENGINE_ID'),
          oauthClientId: this.getEnvVar('VITE_GOOGLE_OAUTH_CLIENT_ID'),
        },
        perplexity: {
          apiKey: this.getEnvVar('VITE_PERPLEXITY_API_KEY'),
        },
        bing: {
          apiKey: this.getEnvVar('VITE_BING_SEARCH_API_KEY'),
        },
        github: {
          token: this.getEnvVar('VITE_GITHUB_TOKEN'),
          clientId: this.getEnvVar('VITE_GITHUB_CLIENT_ID'),
          clientSecret: this.getEnvVar('VITE_GITHUB_CLIENT_SECRET'),
          oauthClientId: this.getEnvVar('VITE_GITHUB_OAUTH_CLIENT_ID'),
        },
        youtube: {
          apiKey: this.getEnvVar('VITE_YOUTUBE_API_KEY'),
        },
        kaggle: {
          username: this.getEnvVar('VITE_KAGGLE_USERNAME'),
          key: this.getEnvVar('VITE_KAGGLE_KEY'),
        },
        semanticScholar: {
          apiKey: this.getEnvVar('VITE_SEMANTIC_SCHOLAR_API_KEY'),
        },
      },

      ai: {
        gemini: {
          apiKey: this.getEnvVar('VITE_GEMINI_API_KEY'),
          model: this.getEnvVar('VITE_GEMINI_MODEL', 'gemini-1.5-flash'),
        },
        openai: this.getOptionalEnvVar('VITE_OPENAI_API_KEY') ? {
          apiKey: this.getEnvVar('VITE_OPENAI_API_KEY'),
          model: this.getEnvVar('VITE_OPENAI_MODEL', 'gpt-4'),
        } : undefined,
      },

      database: {
        supabase: {
          url: this.getEnvVar('VITE_SUPABASE_URL'),
          anonKey: this.getEnvVar('VITE_SUPABASE_ANON_KEY'),
          serviceRoleKey: this.getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY'),
        },
        mongodb: {
          uri: this.getEnvVar('VITE_MONGODB_URI'),
          dbName: this.getEnvVar('VITE_MONGODB_DB_NAME', 'searchcenter_live'),
        },
        redis: this.getOptionalEnvVar('VITE_REDIS_URL') ? {
          url: this.getEnvVar('VITE_REDIS_URL'),
          password: this.getEnvVar('VITE_REDIS_PASSWORD'),
        } : undefined,
      },

      payment: {
        razorpay: {
          key: this.getEnvVar('VITE_RAZORPAY_KEY'),
          secret: this.getEnvVar('VITE_RAZORPAY_SECRET'),
          webhookSecret: this.getEnvVar('VITE_RAZORPAY_WEBHOOK_SECRET'),
        },
        plans: {
          pro: {
            monthly: parseInt(this.getEnvVar('VITE_PRO_PLAN_PRICE_MONTHLY', '39')),
            yearly: parseInt(this.getEnvVar('VITE_PRO_PLAN_PRICE_YEARLY', '399')),
          },
          ultra: {
            monthly: parseInt(this.getEnvVar('VITE_ULTRA_PLAN_PRICE_MONTHLY', '99')),
            yearly: parseInt(this.getEnvVar('VITE_ULTRA_PLAN_PRICE_YEARLY', '999')),
          },
        },
      },

      notifications: {
        emailjs: {
          serviceId: this.getEnvVar('VITE_EMAILJS_SERVICE_ID'),
          templateId: this.getEnvVar('VITE_EMAILJS_TEMPLATE_ID'),
          publicKey: this.getEnvVar('VITE_EMAILJS_PUBLIC_KEY'),
        },
        smtp: this.getOptionalEnvVar('VITE_SMTP_HOST') ? {
          host: this.getEnvVar('VITE_SMTP_HOST'),
          port: parseInt(this.getEnvVar('VITE_SMTP_PORT', '587')),
          user: this.getEnvVar('VITE_SMTP_USER'),
          pass: this.getEnvVar('VITE_SMTP_PASS'),
        } : undefined,
      },

      storage: {
        aws: this.getOptionalEnvVar('VITE_AWS_ACCESS_KEY_ID') ? {
          accessKeyId: this.getEnvVar('VITE_AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.getEnvVar('VITE_AWS_SECRET_ACCESS_KEY'),
          region: this.getEnvVar('VITE_AWS_REGION', 'us-east-1'),
          s3Bucket: this.getEnvVar('VITE_AWS_S3_BUCKET'),
          cdnUrl: this.getEnvVar('VITE_AWS_CDN_URL'),
        } : undefined,
        cloudinary: this.getOptionalEnvVar('VITE_CLOUDINARY_CLOUD_NAME') ? {
          cloudName: this.getEnvVar('VITE_CLOUDINARY_CLOUD_NAME'),
          apiKey: this.getEnvVar('VITE_CLOUDINARY_API_KEY'),
          apiSecret: this.getEnvVar('VITE_CLOUDINARY_API_SECRET'),
        } : undefined,
      },

      analytics: {
        googleAnalytics: this.getOptionalEnvVar('VITE_GA_MEASUREMENT_ID') ? {
          measurementId: this.getEnvVar('VITE_GA_MEASUREMENT_ID'),
        } : undefined,
        sentry: this.getOptionalEnvVar('VITE_SENTRY_DSN') ? {
          dsn: this.getEnvVar('VITE_SENTRY_DSN'),
        } : undefined,
        logRocket: this.getOptionalEnvVar('VITE_LOGROCKET_APP_ID') ? {
          appId: this.getEnvVar('VITE_LOGROCKET_APP_ID'),
        } : undefined,
      },

      security: {
        jwt: {
          secret: this.getEnvVar('VITE_JWT_SECRET'),
          expiresIn: this.getEnvVar('VITE_JWT_EXPIRES_IN', '7d'),
        },
        rateLimit: {
          windowMs: parseInt(this.getEnvVar('VITE_RATE_LIMIT_WINDOW_MS', '900000')),
          maxRequests: parseInt(this.getEnvVar('VITE_RATE_LIMIT_MAX_REQUESTS', '100')),
        },
        cors: {
          allowedOrigins: this.getEnvVar('VITE_ALLOWED_ORIGINS', 'http://localhost:5173,https://yourdomain.com').split(','),
        },
        recaptcha: {
          siteKey: this.getEnvVar('VITE_RECAPTCHA_SITE_KEY'),
          secretKey: this.getEnvVar('VITE_RECAPTCHA_SECRET_KEY'),
        },
        emailVerification: {
          required: this.getEnvVar('VITE_EMAIL_VERIFICATION_REQUIRED', 'true') === 'true',
          tokenExpires: this.getEnvVar('VITE_EMAIL_VERIFICATION_TOKEN_EXPIRES', '24h'),
        },
      },

      search: {
        defaultLimit: parseInt(this.getEnvVar('VITE_DEFAULT_SEARCH_LIMIT', '20')),
        maxLimit: parseInt(this.getEnvVar('VITE_MAX_SEARCH_LIMIT', '100')),
        cacheTTL: parseInt(this.getEnvVar('VITE_SEARCH_CACHE_TTL', '300')),
        defaultLanguage: this.getEnvVar('VITE_DEFAULT_LANGUAGE', 'en'),
        supportedLanguages: this.getEnvVar('VITE_SUPPORTED_LANGUAGES', 'en,es,fr,de,ja,zh,hi,ta,te').split(','),
      },

      deployment: {
        appUrl: this.getEnvVar('VITE_APP_URL', 'http://localhost:5173'),
        apiBaseUrl: this.getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001/api'),
        backendUrl: this.getEnvVar('VITE_BACKEND_URL', 'http://localhost:3001'),
        nodeEnv: this.getEnvVar('VITE_NODE_ENV', 'development'),
        logLevel: this.getEnvVar('VITE_LOG_LEVEL', 'debug'),
        port: parseInt(this.getEnvVar('VITE_PORT', '5173')),
      },

      social: {
        google: {
          oauthClientId: this.getEnvVar('VITE_GOOGLE_OAUTH_CLIENT_ID'),
        },
        github: {
          oauthClientId: this.getEnvVar('VITE_GITHUB_OAUTH_CLIENT_ID'),
        },
        microsoft: this.getOptionalEnvVar('VITE_MICROSOFT_OAUTH_CLIENT_ID') ? {
          oauthClientId: this.getEnvVar('VITE_MICROSOFT_OAUTH_CLIENT_ID'),
        } : undefined,
      },

      features: {
        enableAIFeatures: this.getEnvVar('VITE_ENABLE_AI_FEATURES', 'true') === 'true',
        enableAdvancedSearch: this.getEnvVar('VITE_ENABLE_ADVANCED_SEARCH', 'true') === 'true',
        enableSocialFeatures: this.getEnvVar('VITE_ENABLE_SOCIAL_FEATURES', 'true') === 'true',
        enableAnalytics: this.getEnvVar('VITE_ENABLE_ANALYTICS', 'true') === 'true',
        enableNotifications: this.getEnvVar('VITE_ENABLE_NOTIFICATIONS', 'true') === 'true',
        enableSubscriptions: this.getEnvVar('VITE_ENABLE_SUBSCRIPTIONS', 'true') === 'true',
        enableAdminPanel: this.getEnvVar('VITE_ENABLE_ADMIN_PANEL', 'true') === 'true',
        enableBetaFeatures: this.getEnvVar('VITE_ENABLE_BETA_FEATURES', 'false') === 'true',
        enableExperimentalAI: this.getEnvVar('VITE_ENABLE_EXPERIMENTAL_AI', 'false') === 'true',
      },
    };
  }

  private getEnvVar(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private getOptionalEnvVar(key: string): string | undefined {
    return import.meta.env[key];
  }

  private validateConfiguration(): void {
    const errors: string[] = [];

    // Validate critical variables
    const criticalVars = [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'VITE_ADMIN_EMAIL',
      'VITE_MONGODB_URI',
      'VITE_SUPABASE_URL',
      'VITE_RAZORPAY_KEY'
    ];

    criticalVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        errors.push(`Critical environment variable ${varName} is missing`);
      }
    });

    if (errors.length > 0) {
      console.error('Configuration validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Configuration validation failed. Check environment variables.');
    }

    console.log('✅ Configuration loaded successfully');
  }

  // Public getters for specific configuration sections
  public getAuth() {
    return this.config.auth;
  }

  public getAPIs() {
    return this.config.apis;
  }

  public getAI() {
    return this.config.ai;
  }

  public getDatabase() {
    return this.config.database;
  }

  public getPayment() {
    return this.config.payment;
  }

  public getNotifications() {
    return this.config.notifications;
  }

  public getStorage() {
    return this.config.storage;
  }

  public getAnalytics() {
    return this.config.analytics;
  }

  public getSecurity() {
    return this.config.security;
  }

  public getSearch() {
    return this.config.search;
  }

  public getDeployment() {
    return this.config.deployment;
  }

  public getSocial() {
    return this.config.social;
  }

  public getFeatures() {
    return this.config.features;
  }

  // Check if specific features are enabled
  public isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.config.features[feature];
  }

  // Get admin configuration
  public getAdminConfig() {
    return this.config.auth.admin;
  }

  // Check if current user is admin
  public isAdmin(email: string): boolean {
    return email === this.config.auth.admin.email;
  }

  // Get API status for health checks
  public getAPIStatus() {
    return {
      clerk: !!this.config.auth.clerk.publishableKey,
      gemini: !!this.config.ai.gemini.apiKey,
      razorpay: !!this.config.payment.razorpay.key,
      supabase: !!this.config.database.supabase.url,
      mongodb: !!this.config.database.mongodb.uri,
    };
  }

  // Configuration for development vs production
  public isDevelopment(): boolean {
    return this.config.deployment.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.deployment.nodeEnv === 'production';
  }

  // Get all configuration (use carefully, prefer specific getters)
  public getAll(): AppConfig {
    return this.config;
  }
}

// Export singleton instance
export const config = new ConfigService();

// Export types for use in components
export type { AppConfig };

// Export utility functions for common use
export const isFeatureEnabled = (feature: keyof AppConfig['features']) => config.isFeatureEnabled(feature);
export const isAdmin = (email: string) => config.isAdmin(email);
export const getAPIEndpoints = () => ({
  clerk: `https://api.clerk.dev/v1`,
  search: config.getDeployment().apiBaseUrl,
  github: 'https://api.github.com',
  youtube: 'https://www.googleapis.com/youtube/v3',
  kaggle: 'https://www.kaggle.com/api/v1',
  semanticScholar: 'https://api.semanticscholar.org/graph/v1',
});

export default config;
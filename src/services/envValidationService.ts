/**
 * Environment Validation Service
 * Provides runtime validation and health checks for environment configuration
 */

import { config } from '../config/envConfig';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingCritical: string[];
  missingOptional: string[];
}

interface APIHealthCheck {
  service: string;
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  expectedStatus?: number;
}

class EnvironmentValidationService {
  private validationResults: ValidationResult | null = null;

  constructor() {
    this.performInitialValidation();
  }

  private performInitialValidation(): void {
    console.log('🔍 Performing environment validation...');
    const result = this.validateEnvironment();
    this.validationResults = result;
    this.logValidationResults(result);
  }

  public validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingCritical: string[] = [];
    const missingOptional: string[] = [];

    // Critical variables that must be present
    const criticalVars = [
      'VITE_CLERK_PUBLISHABLE_KEY',
      'VITE_ADMIN_EMAIL',
      'VITE_MONGODB_URI',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_RAZORPAY_KEY'
    ];

    // Important but optional variables
    const importantVars = [
      'VITE_GEMINI_API_KEY',
      'VITE_GOOGLE_SEARCH_API_KEY',
      'VITE_GITHUB_TOKEN',
      'VITE_YOUTUBE_API_KEY',
      'VITE_EMAILJS_PUBLIC_KEY',
      'VITE_GA_MEASUREMENT_ID'
    ];

    // Check critical variables
    criticalVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        missingCritical.push(varName);
        errors.push(`Critical: ${varName} is required but not set`);
      }
    });

    // Check important variables
    importantVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        missingOptional.push(varName);
        warnings.push(`Important: ${varName} is recommended but not set`);
      }
    });

    // Validate email formats
    if (import.meta.env.VITE_ADMIN_EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(import.meta.env.VITE_ADMIN_EMAIL)) {
        errors.push('VITE_ADMIN_EMAIL format is invalid');
      }
    }

    // Validate URLs
    const urlVars = ['VITE_SUPABASE_URL', 'VITE_MONGODB_URI', 'VITE_APP_URL'];
    urlVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (value && !this.isValidURL(value)) {
        errors.push(`${varName} format is invalid`);
      }
    });

    // Validate numeric values
    const numericVars = {
      'VITE_PRO_PLAN_PRICE_MONTHLY': 39,
      'VITE_ULTRA_PLAN_PRICE_MONTHLY': 99,
      'VITE_DEFAULT_SEARCH_LIMIT': 20,
      'VITE_MAX_SEARCH_LIMIT': 100
    };

    Object.entries(numericVars).forEach(([varName, defaultValue]) => {
      const value = import.meta.env[varName];
      if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        errors.push(`${varName} must be a positive number`);
      }
    });

    // Validate boolean flags
    const boolVars = [
      'VITE_ENABLE_AI_FEATURES',
      'VITE_ENABLE_ADMIN_PANEL',
      'VITE_ENABLE_SUBSCRIPTIONS',
      'VITE_EMAIL_VERIFICATION_REQUIRED'
    ];

    boolVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (value && !['true', 'false'].includes(value)) {
        errors.push(`${varName} must be 'true' or 'false'`);
      }
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      missingCritical,
      missingOptional
    };
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private logValidationResults(result: ValidationResult): void {
    if (result.isValid) {
      console.log('✅ Environment validation passed');
    } else {
      console.error('❌ Environment validation failed');
      result.errors.forEach(error => console.error(`  ❌ ${error}`));
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Environment warnings:');
      result.warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`));
    }

    if (result.missingOptional.length > 0) {
      console.log('ℹ️ Optional variables not set (some features may be limited):');
      result.missingOptional.forEach(varName => console.log(`  ℹ️ ${varName}`));
    }
  }

  public getValidationResults(): ValidationResult | null {
    return this.validationResults;
  }

  public isEnvironmentValid(): boolean {
    return this.validationResults?.isValid ?? false;
  }

  public getFeatureAvailability(): Record<string, boolean> {
    const features = {
      authentication: !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
      aiFeatures: !!import.meta.env.VITE_GEMINI_API_KEY,
      search: !!import.meta.env.VITE_GOOGLE_SEARCH_API_KEY,
      payments: !!import.meta.env.VITE_RAZORPAY_KEY,
      database: !!import.meta.env.VITE_MONGODB_URI && !!import.meta.env.VITE_SUPABASE_URL,
      analytics: !!import.meta.env.VITE_GA_MEASUREMENT_ID,
      notifications: !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      github: !!import.meta.env.VITE_GITHUB_TOKEN,
      youtube: !!import.meta.env.VITE_YOUTUBE_API_KEY,
      kaggle: !!import.meta.env.VITE_KAGGLE_USERNAME && !!import.meta.env.VITE_KAGGLE_KEY,
      cloudStorage: !!import.meta.env.VITE_AWS_ACCESS_KEY_ID || !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    };

    return features;
  }

  public async performHealthChecks(): Promise<Record<string, boolean>> {
    const healthChecks: Record<string, boolean> = {};

    // Test Clerk connectivity
    if (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
      try {
        // Basic connectivity test - just check if the key format looks valid
        const keyFormat = /^pk_test_[a-zA-Z0-9]+$/;
        healthChecks.clerk = keyFormat.test(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
      } catch {
        healthChecks.clerk = false;
      }
    }

    // Test Supabase connectivity
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        healthChecks.supabase = response.ok;
      } catch {
        healthChecks.supabase = false;
      }
    }

    // Test API endpoints
    const apiTests = [
      {
        name: 'googleSearch',
        url: `https://www.googleapis.com/customsearch/v1?key=${import.meta.env.VITE_GOOGLE_SEARCH_API_KEY}&cx=test&q=test`,
        requiresKey: 'VITE_GOOGLE_SEARCH_API_KEY'
      }
    ];

    for (const test of apiTests) {
      if (import.meta.env[test.requiresKey]) {
        try {
          const response = await fetch(test.url, { method: 'HEAD' });
          // Google API returns 400 for invalid cx, but 403 for invalid key
          healthChecks[test.name] = response.status !== 403;
        } catch {
          healthChecks[test.name] = false;
        }
      }
    }

    return healthChecks;
  }

  public getConfigurationSummary(): {
    environment: string;
    features: Record<string, boolean>;
    apis: Record<string, boolean>;
    health: Record<string, boolean>;
  } {
    return {
      environment: config.getDeployment().nodeEnv,
      features: this.getFeatureAvailability(),
      apis: config.getAPIStatus(),
      health: {} // Will be populated by performHealthChecks
    };
  }

  public generateEnvironmentReport(): string {
    const result = this.validationResults || this.validateEnvironment();
    const features = this.getFeatureAvailability();

    let report = '# Environment Configuration Report\n\n';

    report += `**Environment:** ${config.getDeployment().nodeEnv}\n`;
    report += `**Valid:** ${result.isValid ? '✅ Yes' : '❌ No'}\n`;
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    report += '## Feature Availability\n\n';
    Object.entries(features).forEach(([feature, available]) => {
      report += `- ${feature}: ${available ? '✅ Available' : '❌ Unavailable'}\n`;
    });

    if (result.errors.length > 0) {
      report += '\n## Errors\n\n';
      result.errors.forEach(error => {
        report += `- ❌ ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += '\n## Warnings\n\n';
      result.warnings.forEach(warning => {
        report += `- ⚠️ ${warning}\n`;
      });
    }

    report += '\n## Configuration Summary\n\n';
    report += `- Admin Email: ${import.meta.env.VITE_ADMIN_EMAIL || 'Not set'}\n`;
    report += `- Payment Gateway: ${import.meta.env.VITE_RAZORPAY_KEY ? '✅ Razorpay' : '❌ Not configured'}\n`;
    report += `- AI Features: ${import.meta.env.VITE_GEMINI_API_KEY ? '✅ Gemini' : '❌ Not configured'}\n`;
    report += `- Database: ${import.meta.env.VITE_MONGODB_URI ? '✅ MongoDB' : '❌ Not configured'}\n`;
    report += `- Analytics: ${import.meta.env.VITE_GA_MEASUREMENT_ID ? '✅ Google Analytics' : '❌ Not configured'}\n`;

    return report;
  }

  public exportConfiguration(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      environment: config.getDeployment().nodeEnv,
      validation: this.validationResults,
      features: this.getFeatureAvailability(),
      apis: config.getAPIStatus(),
      deployment: config.getDeployment(),
      // Don't export actual secrets for security
      configuredKeys: {
        clerk: !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
        gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
        razorpay: !!import.meta.env.VITE_RAZORPAY_KEY,
        supabase: !!import.meta.env.VITE_SUPABASE_URL,
        mongodb: !!import.meta.env.VITE_MONGODB_URI,
        emailjs: !!import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        analytics: !!import.meta.env.VITE_GA_MEASUREMENT_ID
      }
    };
  }
}

// Export singleton instance
export const envValidation = new EnvironmentValidationService();

export default envValidation;
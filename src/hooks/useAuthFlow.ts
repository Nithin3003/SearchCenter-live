import { useState, useCallback } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useAuth } from '../lib/auth-context';

interface AuthFlowState {
  mode: 'signin' | 'signup';
  loading: boolean;
  error: string | null;
}

interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

export function useAuthFlow() {
  const [state, setState] = useState<AuthFlowState>({
    mode: 'signin',
    loading: false,
    error: null,
  });

  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const setMode = useCallback((mode: 'signin' | 'signup') => {
    setState(prev => ({ ...prev, mode, error: null }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const validateCredentials = useCallback((credentials: AuthCredentials): string | null => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return 'Please enter a valid email address';
    }

    // Password validation
    if (credentials.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(credentials.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Name validation for signup
    if (state.mode === 'signup' && !credentials.name?.trim()) {
      return 'Please enter your name';
    }

    return null;
  }, [state.mode]);

  const handleAuth = useCallback(async (credentials: AuthCredentials) => {
    // Clear previous errors
    setError(null);
    setLoading(true);

    // Validate credentials
    const validationError = validateCredentials(credentials);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      if (state.mode === 'signin') {
        await signIn({
          identifier: credentials.email,
          password: credentials.password,
        });
      } else {
        await signUp({
          emailAddress: credentials.email,
          password: credentials.password,
          firstName: credentials.name?.split(' ')[0] || '',
          lastName: credentials.name?.split(' ').slice(1).join(' ') || '',
        });
      }

      // Redirect to dashboard on successful auth
      router.push('/');
    } catch (error: any) {
      console.error('Authentication error:', error);

      // Handle specific error messages
      let errorMessage = 'An unexpected error occurred';

      if (error.status === 400) {
        if (state.mode === 'signin') {
          errorMessage = 'Invalid email or password';
        } else {
          errorMessage = 'Email already exists or invalid information';
        }
      } else if (error.status === 429) {
        errorMessage = 'Too many attempts. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.mode, validateCredentials, setError, setLoading, signIn, signUp, router]);

  const handleSocialAuth = useCallback(async (provider: 'google' | 'github') => {
    setError(null);
    setLoading(true);

    try {
      // This would integrate with Clerk's social auth
      // For now, we'll simulate the process
      console.log(`Initiating ${provider} authentication...`);

      // In a real implementation, you would use:
      // await signInWithProvider({ provider });

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      console.error('Social authentication error:', error);
      setError('Failed to authenticate with social provider');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, router]);

  const handlePasswordReset = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);

    try {
      // This would integrate with Clerk's password reset
      // For now, we'll simulate the process
      console.log(`Sending password reset email to: ${email}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Failed to send password reset email');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    // State
    mode: state.mode,
    loading: state.loading,
    error: state.error,

    // Actions
    setMode,
    handleAuth,
    handleSocialAuth,
    handlePasswordReset,
    clearError,
  };
}

// Simple router hook for navigation
export function useRouter() {
  const push = (path: string) => {
    window.location.href = path;
  };

  const replace = (path: string) => {
    window.location.replace(path);
  };

  const back = () => {
    window.history.back();
  };

  return {
    push,
    replace,
    back,
  };
}
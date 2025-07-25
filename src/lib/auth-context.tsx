import { createContext, useContext, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isClerkLoaded, user } = useUser();
  const userId = user?.id ?? null;
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // In a real application, you would fetch this from your database
  const isAdmin = userId === import.meta.env.VITE_ADMIN_USER_ID;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const value = {
    isAuthenticated: !!userId,
    isLoading: !isClerkLoaded,
    userId,
    isAdmin,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuths() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useCustomAuth() {
  // Some other logic
}
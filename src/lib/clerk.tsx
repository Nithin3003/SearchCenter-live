import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth-context';

const clerkPubKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk publishable key');
}

const queryClient = new QueryClient();

export function ClerkProviderConfig({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
          card: 'bg-gray-900 border border-gray-800',
          formFieldInput: 'bg-gray-800 border-gray-700 text-white',
          formFieldLabel: 'text-gray-300',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
          socialButtonsBlockButton: 'bg-gray-800 border-gray-700 hover:bg-gray-700',
          socialButtonsBlockButtonText: 'text-white font-normal',
          dividerLine: 'bg-gray-700',
          dividerText: 'text-gray-400',
          identityPreviewText: 'text-white',
          formFieldAction: 'text-blue-500 hover:text-blue-400',
          footerActionLink: 'text-blue-500 hover:text-blue-400',
          otpCodeFieldInput: 'bg-gray-800 border-gray-700 text-white',
        },
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* Show the app only when the user is signed in */}
            <SignedIn>
              {children}
            </SignedIn>

            {/* Redirect to Clerk's sign-in page when the user is signed out */}
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}
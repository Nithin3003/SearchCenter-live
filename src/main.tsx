// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import App from './App';
import Feedback from './pages/Feedback';
import AdminPanel from './pages/AdminPanel';
import './index.css';
import Profile from './components/Profile';
import UserProfile from './components/Profile';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function ClerkProviderWithRoutes() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Routes>
        {/* Public routes */}
        <Route
          path="/sign-in/*"
          element={
            <center>
              <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" />
            </center> 
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <center>
              <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/" />
            </center> 
          }
        />

        {/* Private routes: Render content only when signed in */}
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/user" element={<UserProfile />} />
      
                 
                </Routes>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    
    <BrowserRouter>
      <ClerkProviderWithRoutes />
    </BrowserRouter>
  </React.StrictMode>
);

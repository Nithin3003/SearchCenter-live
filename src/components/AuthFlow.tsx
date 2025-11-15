import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignIn, SignUp } from '@clerk/clerk-react';
import {
  Code2,
  PlayCircle,
  Database,
  FileText,
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  Github,
  Chrome
} from 'lucide-react';

interface AuthFlowProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

export default function AuthFlow({ mode = 'signin', onModeChange }: AuthFlowProps) {
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(mode);

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  };

  const features = [
    {
      icon: Code2,
      title: 'Code Search',
      description: 'Search millions of repositories with advanced filtering',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: PlayCircle,
      title: 'Video Tutorials',
      description: 'Find educational videos from YouTube and other platforms',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: Database,
      title: 'Datasets',
      description: 'Access Kaggle datasets for your ML projects',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: FileText,
      title: 'Research Papers',
      description: 'Discover academic papers with Semantic Scholar',
      color: 'from-purple-500 to-violet-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Left Panel - Features */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center mb-8">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold">SearchCenter</h1>
                  <p className="text-blue-100">Knowledge Discovery Platform</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-6">
                {currentMode === 'signin' ? 'Welcome Back' : 'Join the Community'}
              </h2>

              <p className="text-blue-100 mb-8">
                {currentMode === 'signin'
                  ? 'Access your personalized search dashboard and continue your learning journey.'
                  : 'Start exploring millions of code repositories, videos, datasets, and research papers.'
                }
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-blue-100 text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm"
              >
                <p className="text-sm text-blue-100">
                  <span className="font-semibold">AI Mode:</span> Get personalized project suggestions and combine resources intelligently
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Panel - Auth Forms */}
          <div className="p-8 flex flex-col justify-center">
            {/* Tab Switcher */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange('signin')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    currentMode === 'signin'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleModeChange('signup')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    currentMode === 'signup'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </motion.button>
              </div>
            </div>

            {/* Auth Forms with Animation */}
            <div className="min-h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {currentMode === 'signin' ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <SignIn
                      routing="hash"
                      path="/sign-in"
                      fallbackRedirectUrl="/"
                      signUpUrl="/sign-up"
                      redirectUrl="/"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <SignUp
                      routing="hash"
                      path="/sign-up"
                      fallbackRedirectUrl="/"
                      signInUrl="/sign-in"
                      redirectUrl="/"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Additional Features */}
            <div className="mt-6 space-y-4">
              {/* Social Auth Buttons */}
              <div className="text-center text-sm text-gray-500 mb-4">
                Or continue with
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Chrome className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-sm font-medium">Google</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">GitHub</span>
                </motion.button>
              </div>

              {/* Benefits */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-1" />
                    Secure
                  </div>
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" />
                    AI-Powered
                  </div>
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-1" />
                    Rich Resources
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
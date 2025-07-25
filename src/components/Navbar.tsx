import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, Search, Home, MessageSquare, User, Settings, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Notifications from './Notifications';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Check if user is admin
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'msnithin84@gmail.com' || 
                  user?.primaryEmailAddress?.emailAddress === '84msnithin@gmail.com';

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`${scrolled ? 'bg-blue-600 shadow-lg' : 'bg-blue-500'} fixed w-full top-0 z-50 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center group">
              <motion.div 
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Search className="h-8 w-8 text-white" />
              </motion.div>
              <span className="ml-2 text-2xl font-extrabold tracking-tight text-white">SearchCenter</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Navigation links with icons */}
            <Link 
              to="/"
              className={`relative px-4 py-2 flex items-center ${location.pathname === '/' ? 'text-white' : 'text-blue-50 hover:text-white'}`}
            >
              {location.pathname === '/' && (
                <motion.div
                  layoutId="navbar-active"
                  className="absolute inset-0 bg-white bg-opacity-20 rounded-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Home className="h-4 w-4 mr-1.5" />
              <span className="relative z-10 font-semibold text-sm tracking-wide">Home</span>
            </Link>
            
            {isAdmin ? (
              <Link 
                to="/admin"
                className={`relative px-4 py-2 flex items-center ${location.pathname === '/admin' ? 'text-white' : 'text-blue-50 hover:text-white'}`}
              >
                {location.pathname === '/admin' && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-white bg-opacity-20 rounded-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Settings className="h-4 w-4 mr-1.5" />
                <span className="relative z-10 font-semibold text-sm tracking-wide">Admin</span>
              </Link>
            ) : (
              <Link 
                to="/feedback"
                className={`relative px-4 py-2 flex items-center ${location.pathname === '/feedback' ? 'text-white' : 'text-blue-50 hover:text-white'}`}
              >
                {location.pathname === '/feedback' && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-white bg-opacity-20 rounded-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <MessageSquare className="h-4 w-4 mr-1.5" />
                <span className="relative z-10 font-semibold text-sm tracking-wide">Feedback</span>
              </Link>
            )}
            
            <Link 
              to="/user"
              className={`relative px-4 py-2 flex items-center ${location.pathname === '/user' ? 'text-white' : 'text-blue-50 hover:text-white'}`}
            >
              {location.pathname === '/user' && (
                <motion.div
                  layoutId="navbar-active"
                  className="absolute inset-0 bg-white bg-opacity-20 rounded-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <User className="h-4 w-4 mr-1.5" />
              <span className="relative z-10 font-semibold text-sm tracking-wide">Profile</span>
            </Link>
            
            {/* User controls with notifications */}
            {user && (
              <div className="flex items-center space-x-3 ml-2">
                <Notifications />
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  className="relative"
                >
                  <UserButton afterSignOutUrl="/" />
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {/* Show notifications in mobile too */}
            {user && (
              <div className="mr-2">
                <Notifications />
              </div>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-400 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                  location.pathname === '/' ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5 mr-2 text-blue-500" />
                Home
              </Link>
              
              {isAdmin ? (
                <Link
                  to="/admin"
                  className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                    location.pathname === '/admin' ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-2 text-blue-500" />
                  Admin Panel
                </Link>
              ) : (
                <Link
                  to="/feedback"
                  className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                    location.pathname === '/feedback' ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                  Feedback
                </Link>
              )}
              
              <Link
                to="/user"
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center ${
                  location.pathname === '/user' ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Profile
              </Link>
              
              {/* User button in mobile menu */}
              {user && (
                <div className="px-3 py-4 flex items-center border-t border-gray-100 mt-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="ml-3 text-sm text-gray-500">
                    {user.fullName || user.username || 'Your Account'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
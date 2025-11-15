import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Code2,
  PlayCircle,
  Database,
  FileText,
  Grid,
  TrendingUp,
  BookOpen,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import AIProjectBuilder from '../ai/AIProjectBuilder';

interface ModernNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  enableAIMode?: boolean;
  onAIModeToggle?: (enabled: boolean) => void;
}

export default function ModernNavbar({
  activeTab = 'all',
  onTabChange,
  enableAIMode = false,
  onAIModeToggle
}: ModernNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIProjectBuilderOpen, setIsAIProjectBuilderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'New AI recommendations',
      message: 'Based on your search history, we found 5 new projects for you',
      time: '2 hours ago',
      read: false,
      type: 'ai'
    },
    {
      id: 2,
      title: 'Popular datasets updated',
      message: '3 new datasets in machine learning category',
      time: '5 hours ago',
      read: false,
      type: 'dataset'
    },
  ]);

  const { user, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const resourceTabs = [
    { id: 'all', label: 'All Resources', icon: Grid, count: null },
    { id: 'code', label: 'Code', icon: Code2, count: 1250 },
    { id: 'videos', label: 'Videos', icon: PlayCircle, count: 890 },
    { id: 'datasets', label: 'Datasets', icon: Database, count: 450 },
    { id: 'papers', label: 'Papers', icon: FileText, count: 675 },
  ];

  const quickActions = [
    { id: 'trending', label: 'Trending', icon: TrendingUp, href: '/trending' },
    { id: 'popular', label: 'Popular', icon: BookOpen, href: '/popular' },
    { id: 'ai-mode', label: 'AI Mode', icon: Sparkles, action: 'ai' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsProfileDropdownOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileDropdownOpen || isNotificationsOpen) {
        setIsProfileDropdownOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isProfileDropdownOpen, isNotificationsOpen]);

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SearchCenter
                  </span>
                </div>
              </div>

              {/* Resource Tabs - Desktop */}
              <div className="hidden lg:flex items-center ml-8 space-x-1">
                {resourceTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange?.(tab.id)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                      {tab.count && (
                        <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {tab.count >= 1000 ? `${(tab.count / 1000).toFixed(1)}k` : tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search code, videos, datasets, papers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">

              {/* AI Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAIModeToggle?.(!enableAIMode)}
                className={`hidden sm:flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  enableAIMode
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Mode
              </motion.button>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsNotificationsOpen(!isNotificationsOpen);
                    setIsProfileDropdownOpen(false);
                    markNotificationsAsRead();
                  }}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start">
                                <div className={`p-2 rounded-lg mr-3 ${
                                  notification.type === 'ai' ? 'bg-purple-100 text-purple-600' :
                                  notification.type === 'dataset' ? 'bg-green-100 text-green-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {notification.type === 'ai' ? <Sparkles className="h-4 w-4" /> :
                                   notification.type === 'dataset' ? <Database className="h-4 w-4" /> :
                                   <Bell className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {notification.title}
                                  </h4>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="hidden sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>

              {/* Profile */}
              {isSignedIn && user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                      setIsNotificationsOpen(false);
                    }}
                    className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress[0] || 'U'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
                      >
                        <div className="p-4 border-b border-gray-200">
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {user.emailAddresses?.[0]?.emailAddress}
                          </p>
                        </div>
                        <div className="py-2">
                          <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                            <User className="h-4 w-4 mr-3" />
                            Profile
                          </button>
                          <button className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                            <Settings className="h-4 w-4 mr-3" />
                            Settings
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/sign-in')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 bg-white"
            >
              <div className="px-4 py-3 space-y-3">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search resources..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </form>

                {/* Mobile Tabs */}
                <div className="space-y-1">
                  {resourceTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange?.(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.label}
                        {tab.count && (
                          <span className="ml-auto px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tab.count >= 1000 ? `${(tab.count / 1000).toFixed(1)}k` : tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Actions */}
                <div className="pt-3 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAIModeToggle?.(!enableAIMode)}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      enableAIMode
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Mode
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* AI Project Builder Modal */}
      <AnimatePresence>
        {isAIProjectBuilderOpen && (
          <AIProjectBuilder
            onClose={() => setIsAIProjectBuilderOpen(false)}
            onProjectCreated={(project) => {
              console.log('Project created:', project);
              setIsAIProjectBuilderOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
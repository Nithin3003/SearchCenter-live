import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Search, Loader2, Clock, ChevronDown, Filter, FileText } from 'lucide-react';
import Navbar from './components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import ResultsList from './components/ResultsList';
import FilterBar from './components/FilterBar';
import { SearchResult } from './types';
import { fetchSearchResults } from './services/searchService';
import { fetchQuerySuggestions } from './services/GeminiSuggestions';
import { searchService } from './services/search-service';
import { useUserSync } from './hooks/useUserSync';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import ModernNavbar from './components/layout/ModernNavbar';
import EnhancedSidebar from './components/layout/EnhancedSidebar';
import ResourceGrid from './components/resources/ResourceGrid';
import AIProjectBuilder from './components/ai/AIProjectBuilder';
import { enhancedSearchService, SearchFilters } from './services/enhancedSearchService';

function App() {
  // Add this hook to ensure user data syncing
  useUserSync();

  const { user, isLoaded, isSignedIn } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [personalSuggestions, setPersonalSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    time: 'all',
    sort: 'relevance',
    language: 'all',
    license: 'all',
    duration: 'all',
    category: 'all',
  });
  const [error, setError] = useState<string | null>(null);
  const [profileSynced, setProfileSynced] = useState(false);
  const [showReadme, setShowReadme] = useState(true);
  const [enableAIMode, setEnableAIMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [resultCounts, setResultCounts] = useState({
    total: 0,
    code: 0,
    videos: 0,
    datasets: 0,
    papers: 0,
  });

  // Fetch user's search history when component mounts
  useEffect(() => {
    const fetchPersonalSuggestions = async () => {
      if (!isSignedIn || !user) return;

      try {
        const history = await searchService.getSearchHistory(user.id);
        // Extract unique queries from history
        const uniqueQueries = [...new Set(history.map(item => item.query))];
        // Take the 5 most recent unique queries
        setPersonalSuggestions(uniqueQueries.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch search history:', error);
      }
    };

    fetchPersonalSuggestions();
  }, [isSignedIn, user]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    try {
      const searchResults = await enhancedSearchService.searchAll(searchQuery, filters);

      // Combine all results
      const combinedResults = [
        ...searchResults.code.results,
        ...searchResults.videos.results,
        ...searchResults.datasets.results,
        ...searchResults.papers.results,
      ];

      setAllResults(combinedResults);
      setResults(combinedResults);

      // Update result counts
      setResultCounts({
        total: combinedResults.length,
        code: searchResults.code.results.length,
        videos: searchResults.videos.results.length,
        datasets: searchResults.datasets.results.length,
        papers: searchResults.papers.results.length,
      });

      if (combinedResults.length === 0) {
        setError('No results found. Try different search terms or check your filters.');
      }

      // Save search history
      if (user) {
        try {
          await searchService.saveSearchHistory({
            user_id: user.id,
            query: searchQuery,
            result_count: combinedResults.length,
            filters,
          });
        } catch (historyError) {
          console.warn('Failed to save search history:', historyError);
        }
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      const errorMessage = err.message || 'Search failed. Please try again.';
      setError(errorMessage);
      setResults([]);
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      setLoadingSuggestions(true);
      try {
        const fetchedSuggestions = await fetchQuerySuggestions(value);
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  const handleFilterChange = (newFilters: SearchFilters | ((filters: SearchFilters) => SearchFilters)) => {
    if (typeof newFilters === 'function') {
      setFilters(prev => newFilters(prev));
    } else {
      setFilters(newFilters);
    }
  };

  const applyFilters = (results: SearchResult[]) => {
    return results.filter(result => {
      // Apply language filter
      if (filters.language !== 'all' && result.language?.toLowerCase() !== filters.language.toLowerCase()) {
        return false;
      }

      // Apply type filter
      if (filters.type !== 'all' && result.type !== filters.type) {
        return false;
      }

      // Apply repository filter
      if (filters.repository !== 'all' && !result.source.toLowerCase().includes(filters.repository.toLowerCase())) {
        return false;
      }

      // Apply time filter
      if (filters.time !== 'all') {
        const resultDate = new Date(result.timestamp);
        const now = new Date();
        const diffTime = now.getTime() - resultDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        switch (filters.time) {
          case 'day':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }

      return true;
    });
  };

  // Function to highlight matching text in search results
  const highlightMatchingText = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  // Re-fetch when filters change and we have a query
  useEffect(() => {
    if (query) {
      handleSearch(query);
    }
  }, [filters]);

  const filteredResults = applyFilters(results);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Function to render the search bar
  const renderSearchBar = () => {
    return (
      <div className="flex items-center border-2 border-blue-400 rounded-full px-5 py-3 bg-white shadow-lg">
        <Search className="h-5 w-5 text-blue-500" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search code, libraries, solutions..."
          className="w-full px-3 py-1 focus:outline-none text-gray-800 text-lg"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
              setSuggestions([]);
            }
          }}
        />
        {loadingSuggestions ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-blue-600"></div>
        ) : (
          query && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSearch(query)}
              className="ml-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </motion.button>
          )
        )}
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col min-h-screen bg-gray-50">
        <ModernNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          enableAIMode={enableAIMode}
          onAIModeToggle={setEnableAIMode}
        />

        {/* Main Content */}
        <main className="flex flex-1 pt-16">
          {!query ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl px-4">
                {/* SearchCenter Hero */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <div className="flex justify-center items-center mb-8">
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                      <Search className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-4">SearchCenter</h1>
                  <p className="text-xl text-gray-600 mb-8">Discover Code, Videos, Datasets & Papers</p>
                  <p className="text-gray-500 max-w-2xl mx-auto">
                    Search across millions of resources with AI-powered recommendations. Build projects, learn skills, and accelerate your development journey.
                  </p>
                </motion.div>

                {/* Quick Search Categories */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {[
                    {
                      title: "Code",
                      description: "Search repositories, examples, and snippets",
                      icon: Code2,
                      color: "from-blue-500 to-indigo-600",
                      count: "1250+",
                    },
                    {
                      title: "Videos",
                      description: "Educational tutorials and talks",
                      icon: PlayCircle,
                      color: "from-red-500 to-pink-600",
                      count: "890+",
                    },
                    {
                      title: "Datasets",
                      description: "Kaggle datasets for ML projects",
                      icon: Database,
                      color: "from-green-500 to-teal-600",
                      count: "450+",
                    },
                    {
                      title: "Papers",
                      description: "Research papers and publications",
                      icon: FileText,
                      color: "from-purple-500 to-violet-600",
                      count: "675+",
                    }
                  ].map((category, index) => (
                    <motion.button
                      key={category.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                      onClick={() => setActiveTab(category.title.toLowerCase())}
                      className="p-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden group"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${category.color}`}></div>
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${category.color}`}>
                          <category.icon className="h-6 w-6 text-white" />
                        </div>
                        <span className="ml-3 text-2xl font-bold text-gray-800">{category.count}</span>
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Recent Searches */}
                {personalSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-12"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-500" />
                      Recent Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {personalSuggestions.map((item, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          onClick={() => handleSuggestionClick(item)}
                          className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center shadow-md border border-gray-200"
                        >
                          <Search className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          {item}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
              {/* Sidebar */}
              <EnhancedSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                resultCounts={resultCounts}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />

              {/* Results Area */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="max-w-7xl mx-auto p-6">
                    {/* Results Header */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                          Results for <span className="text-blue-600">"{query}"</span>
                        </h2>
                        <div className="flex items-center space-x-2">
                          {enableAIMode && (
                            <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-full flex items-center">
                              <Sparkles className="h-4 w-4 mr-1" />
                              AI Mode
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Resource Grid */}
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-center items-center h-64"
                        >
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                          <span className="ml-2 text-gray-600">Searching across all resources...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <ResourceGrid
                            results={allResults}
                            loading={loading}
                            searchQuery={query}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            totalCount={resultCounts.total}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* AI Project Builder Modal */}
      <AnimatePresence>
        {enableAIMode && (
          <AIProjectBuilder
            onClose={() => setEnableAIMode(false)}
            onProjectCreated={(project) => {
              console.log('Project created:', project);
              // Handle project creation
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;

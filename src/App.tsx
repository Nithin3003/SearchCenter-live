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
  const [activeTab, setActiveTab] = useState<'code'>('code');
  const [filters, setFilters] = useState({
    language: 'all',
    type: 'all',
    time: 'all',
    repository: 'all',
    sort: 'relevance',
  });
  const [error, setError] = useState<string | null>(null);
  const [profileSynced, setProfileSynced] = useState(false);
  const [showReadme, setShowReadme] = useState(true);

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
      const data = await fetchSearchResults(searchQuery, filters);
      setResults(data);

      if (data.length === 0) {
        setError('No results found. Try different search terms or check your filters.');
      }

      // Save search history
      if (user) {
        try {
          await searchService.saveSearchHistory({
            user_id: user.id,
            query: searchQuery,
            result_count: data.length,
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
      setResults([]); // Clear previous results
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

  const handleFilterChange = (type: string, value: string) => {
    if (type === 'reset') {
      setFilters({
        language: 'all',
        type: 'all',
        time: 'all',
        repository: 'all',
        sort: 'relevance',
      });
      return;
    }

    setFilters(prev => ({
      ...prev,
      [type]: value,
    }));
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
        <Navbar />

        {/* Main content - Fixed padding top to prevent content from going under navbar */}
        <main className="flex-grow pt-16"> {/* Added fixed top padding */}
          {!query ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
              <div className="w-full max-w-2xl px-4">
                {/* SearchCenter logo */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <div className="flex justify-center items-center relative">
                    <Search className="h-16 w-16 text-blue-600 mx-auto" />
                    <h1 className="text-5xl font-bold text-gray-900 mt-4">SearchCenter</h1>
                    <p className="text-gray-500 mt-2">Find code. Build faster. Learn together.</p>
                  </div>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.4 }}
                >
                  {renderSearchBar()}

                  {/* Search Suggestions */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl z-10 overflow-hidden"
                      >
                        {suggestions.map((suggestion, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center">
                              <Search className="h-4 w-4 text-blue-500 mr-3" />
                              <span>{suggestion}</span>
                            </div>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Personal Suggestions (search history) */}
                {personalSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8"
                  >
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Recent searches:</h3>
                    <div className="flex flex-wrap gap-2">
                      {personalSuggestions.map((item, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          onClick={() => handleSuggestionClick(item)}
                          className="px-4 py-2 bg-white rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center shadow-md"
                        >
                          <Clock className="h-3.5 w-3.5 mr-2 text-blue-500" />
                          {item}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Quick Suggestion Categories */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                  {[
                    {
                      title: "JavaScript",
                      description: "Popular tutorials and examples",
                      query: "JavaScript tutorials",
                      color: "from-orange-400 to-red-500",
                      delay: 0.8
                    },
                    {
                      title: "React Hooks",
                      description: "Code examples and best practices",
                      query: "React hooks examples",
                      color: "from-blue-400 to-indigo-500",
                      delay: 0.9
                    },
                    {
                      title: "TypeScript",
                      description: "Interfaces and type definitions",
                      query: "TypeScript interfaces",
                      color: "from-teal-400 to-green-500",
                      delay: 1.0
                    }
                  ].map((category, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: category.delay, type: "spring" }}
                      onClick={() => handleSuggestionClick(category.query)}
                      className="p-5 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 text-left relative overflow-hidden group"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${category.color}`}></div>
                      <h3 className="font-bold text-xl text-gray-800 mt-2 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                      <p className="text-gray-500 mt-1 text-sm">{category.description}</p>

                      <div className="mt-4 flex justify-end">
                        <div className="text-xs text-blue-600 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Search now <ChevronDown className="h-3 w-3 ml-1 rotate-270" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="pt-6 pb-8 px-4 sm:px-6 lg:px-8"> {/* Adjusted padding */}
              <div className="w-full max-w-7xl mx-auto">
                {/* Keep search bar visible on results page */}
                <div className="mb-6">
                  {renderSearchBar()}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <h2 className="text-lg font-medium text-gray-900 mb-2">
                    Results for <span className="font-bold">{query}</span>
                  </h2>
                </motion.div>

                {/* Two-column layout with FilterBar on left and results on right */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Column - FilterBar */}
                  <div className="w-full lg:w-64 flex-shrink-0">
                    <FilterBar 
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      resultCount={filteredResults.length}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      results={filteredResults}
                    />
                  </div>
                  
                  {/* Right Column - Results */}
                  <div className="flex-1">
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
                          <span className="ml-2 text-gray-600">Searching...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="results"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          {/* Show README.md matches if available */}
                          {showReadme && filteredResults.some(result => result.source.includes('README.md') || result.title?.includes('README')) && (
                            <div className="mb-8 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                              <h3 className="text-lg font-semibold mb-2 flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                README Files
                              </h3>

                              <div className="space-y-4">
                                {filteredResults
                                  .filter(result => result.source.includes('README.md') || result.title?.includes('README'))
                                  .slice(0, 3)
                                  .map((result, idx) => (
                                    <div key={`readme-${idx}`} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                                      <a 
                                        href={result.url} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      >
                                        {result.title || result.source}
                                      </a>
                                      {result.description && (
                                        <p 
                                          className="text-sm text-gray-700 mt-1"
                                          dangerouslySetInnerHTML={{ __html: highlightMatchingText(result.description, query) }}
                                        />
                                      )}
                                      <div className="flex items-center mt-2 text-xs text-gray-500">
                                        <span className="flex items-center">
                                          <span className="w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
                                          {result.source.split('/').slice(-2).join('/')}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          <ResultsList
                            results={filteredResults}
                            searchQuery={query}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Grid,
  List,
  SortAsc,
  Search,
  Code2,
  PlayCircle,
  Database,
  FileText,
  Loader2,
  ArrowUpDown,
  ChevronDown,
  Star,
  Eye,
  Download,
  Quote
} from 'lucide-react';
import { SearchFilters, SearchResult } from '../../services/enhancedSearchService';
import CodePreview from './CodePreview';
import VideoPreview from './VideoPreview';
import DatasetPreview from './DatasetPreview';
import PaperPreview from './PaperPreview';

interface ResourceGridProps {
  results: SearchResult[];
  loading?: boolean;
  searchQuery?: string;
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number;
}

type ViewMode = 'grid' | 'list';
type ContentType = 'all' | 'code' | 'videos' | 'datasets' | 'papers';
type SortOption = 'relevance' | 'date' | 'popularity' | 'stars' | 'views' | 'downloads' | 'citations';

export default function ResourceGrid({
  results,
  loading = false,
  searchQuery,
  filters,
  onFilterChange,
  onLoadMore,
  hasMore = false,
  totalCount = 0
}: ResourceGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const sortOptions: { value: SortOption; label: string; icon: any }[] = [
    { value: 'relevance', label: 'Relevance', icon: Search },
    { value: 'date', label: 'Date', icon: SortAsc },
    { value: 'popularity', label: 'Popularity', icon: ArrowUpDown },
    { value: 'stars', label: 'Stars', icon: Star },
    { value: 'views', label: 'Views', icon: Eye },
    { value: 'downloads', label: 'Downloads', icon: Download },
    { value: 'citations', label: 'Citations', icon: Quote },
  ];

  const contentTypes: { value: ContentType; label: string; icon: any; color: string }[] = [
    { value: 'all', label: 'All Resources', icon: Grid, color: 'from-gray-500 to-gray-600' },
    { value: 'code', label: 'Code', icon: Code2, color: 'from-blue-500 to-indigo-600' },
    { value: 'videos', label: 'Videos', icon: PlayCircle, color: 'from-red-500 to-pink-600' },
    { value: 'datasets', label: 'Datasets', icon: Database, color: 'from-green-500 to-teal-600' },
    { value: 'papers', label: 'Papers', icon: FileText, color: 'from-purple-500 to-violet-600' },
  ];

  // Filter results based on content type
  const filteredResults = results.filter(result => {
    if (contentType === 'all') return true;

    // Type checking based on available properties
    switch (contentType) {
      case 'code':
        return 'language' in result && 'codeSnippet' in result;
      case 'videos':
        return 'thumbnail' in result && 'duration' in result;
      case 'datasets':
        return 'downloadCount' in result && 'fileSize' in result;
      case 'papers':
        return 'authors' in result && 'citationCount' in result;
      default:
        return true;
    }
  });

  // Sort results based on selected option
  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return 0; // API should handle relevance
      case 'date':
        return new Date((b as any).lastUpdated || (b as any).publishedAt).getTime() -
               new Date((a as any).lastUpdated || (a as any).publishedAt).getTime();
      case 'popularity':
        const getPopularity = (item: SearchResult) => {
          if ('stars' in item) return item.stars;
          if ('viewCount' in item) return item.viewCount;
          if ('downloadCount' in item) return item.downloadCount;
          if ('citationCount' in item) return item.citationCount;
          return 0;
        };
        return getPopularity(b) - getPopularity(a);
      case 'stars':
        return ((b as any).stars || 0) - ((a as any).stars || 0);
      case 'views':
        return ((b as any).viewCount || 0) - ((a as any).viewCount || 0);
      case 'downloads':
        return ((b as any).downloadCount || 0) - ((a as any).downloadCount || 0);
      case 'citations':
        return ((b as any).citationCount || 0) - ((a as any).citationCount || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const resultsPerPage = viewMode === 'grid' ? 12 : 8;
  const paginatedResults = sortedResults.slice(0, currentPage * resultsPerPage);

  // Detect result type
  const getResultType = (result: SearchResult): 'code' | 'video' | 'dataset' | 'paper' => {
    if ('language' in result && 'codeSnippet' in result) return 'code';
    if ('thumbnail' in result && 'duration' in result) return 'video';
    if ('downloadCount' in result && 'fileSize' in result) return 'dataset';
    if ('authors' in result && 'citationCount' in result) return 'paper';
    return 'code'; // fallback
  };

  // Get counts for each content type
  const getContentCounts = () => {
    const counts = {
      all: results.length,
      code: results.filter(r => 'language' in r && 'codeSnippet' in r).length,
      videos: results.filter(r => 'thumbnail' in r && 'duration' in r).length,
      datasets: results.filter(r => 'downloadCount' in r && 'fileSize' in r).length,
      papers: results.filter(r => 'authors' in r && 'citationCount' in r).length,
    };
    return counts;
  };

  const contentCounts = getContentCounts();

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && !loading && hasMore) {
      onLoadMore();
      setCurrentPage(prev => prev + 1);
    }
  }, [onLoadMore, loading, hasMore]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        !loading &&
        hasMore
      ) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleLoadMore, loading, hasMore]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Content Type Tabs */}
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const count = contentCounts[type.value];
              return (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleContentTypeChange(type.value)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    contentType === type.value
                      ? `bg-gradient-to-r ${type.color} text-white shadow-md`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {type.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    contentType === type.value ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="appearance-none bg-gray-100 text-gray-700 px-4 py-2 pr-8 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Filters Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Period
                  </label>
                  <select
                    value={filters.time || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, time: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All time</option>
                    <option value="day">Last 24 hours</option>
                    <option value="week">Last week</option>
                    <option value="month">Last month</option>
                    <option value="year">Last year</option>
                  </select>
                </div>

                {/* License Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License
                  </label>
                  <select
                    value={filters.license || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, license: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Any license</option>
                    <option value="MIT">MIT</option>
                    <option value="Apache-2.0">Apache 2.0</option>
                    <option value="GPL-3.0">GPL 3.0</option>
                    <option value="CC0">CC0</option>
                  </select>
                </div>

                {/* Language Filter */}
                {contentType === 'code' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Language
                    </label>
                    <select
                      value={filters.language || 'all'}
                      onChange={(e) => onFilterChange({ ...filters, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All languages</option>
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="typescript">TypeScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                    </select>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-gray-700">
          {searchQuery && (
            <span>
              Showing <span className="font-semibold">{paginatedResults.length}</span> of{' '}
              <span className="font-semibold">{totalCount || sortedResults.length}</span> results
              {contentType !== 'all' && (
                <span> for <span className="font-semibold">{contentType}</span></span>
              )}
              {searchQuery && (
                <span> for "<span className="font-semibold">{searchQuery}</span>"</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className={viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6'
        : 'space-y-6'
      }>
        <AnimatePresence mode="wait">
          {paginatedResults.map((result, index) => {
            const type = getResultType(result);
            const delay = index * 0.1;

            return (
              <motion.div
                key={`${type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: Math.min(delay, 0.5) }}
                layout
              >
                {type === 'code' && (
                  <CodePreview result={result as any} searchQuery={searchQuery} />
                )}
                {type === 'video' && (
                  <VideoPreview result={result as any} searchQuery={searchQuery} />
                )}
                {type === 'dataset' && (
                  <DatasetPreview result={result as any} searchQuery={searchQuery} />
                )}
                {type === 'paper' && (
                  <PaperPreview result={result as any} searchQuery={searchQuery} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600">Loading more resources...</span>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && paginatedResults.length < sortedResults.length && (
        <div className="flex justify-center mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoadMore}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Resources
          </motion.button>
        </div>
      )}

      {/* No Results */}
      {!loading && paginatedResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No resources found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  Star,
  Eye,
  Download,
  Quote,
  Code2,
  PlayCircle,
  Database,
  FileText,
  Users,
  Shield,
  Globe,
  Clock,
  BarChart3,
  Award,
  TrendingUp,
  Zap
} from 'lucide-react';
import { SearchFilters } from '../../services/enhancedSearchService';

interface EnhancedSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  resultCounts?: {
    total: number;
    code: number;
    videos: number;
    datasets: number;
    papers: number;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function EnhancedSidebar({
  filters,
  onFilterChange,
  resultCounts = {
    total: 0,
    code: 0,
    videos: 0,
    datasets: 0,
    papers: 0,
  },
  isOpen = true,
  onToggle
}: EnhancedSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content-type', 'time', 'sorting']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      type: 'all',
      time: 'all',
      sort: 'relevance',
      language: 'all',
      license: 'all',
      duration: 'all',
      category: 'all',
    });
  };

  const contentTypeOptions = [
    { id: 'all', label: 'All Resources', icon: Globe, count: resultCounts.total },
    { id: 'code', label: 'Code', icon: Code2, count: resultCounts.code },
    { id: 'videos', label: 'Videos', icon: PlayCircle, count: resultCounts.videos },
    { id: 'datasets', label: 'Datasets', icon: Database, count: resultCounts.datasets },
    { id: 'papers', label: 'Papers', icon: FileText, count: resultCounts.papers },
  ];

  const timeOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'day', label: 'Last 24 Hours' },
    { id: 'week', label: 'Last Week' },
    { id: 'month', label: 'Last Month' },
    { id: 'year', label: 'Last Year' },
  ];

  const sortOptions = [
    { id: 'relevance', label: 'Relevance', icon: Zap },
    { id: 'stars', label: 'Stars', icon: Star },
    { id: 'views', label: 'Views', icon: Eye },
    { id: 'downloads', label: 'Downloads', icon: Download },
    { id: 'citations', label: 'Citations', icon: Quote },
    { id: 'updated', label: 'Last Updated', icon: Calendar },
  ];

  const languageOptions = [
    { id: 'all', label: 'All Languages' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'java', label: 'Java' },
    { id: 'cpp', label: 'C++' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'ruby', label: 'Ruby' },
    { id: 'php', label: 'PHP' },
  ];

  const licenseOptions = [
    { id: 'all', label: 'All Licenses' },
    { id: 'MIT', label: 'MIT License' },
    { id: 'Apache-2.0', label: 'Apache 2.0' },
    { id: 'GPL-3.0', label: 'GPL 3.0' },
    { id: 'BSD-3-Clause', label: 'BSD 3-Clause' },
    { id: 'CC0', label: 'Creative Commons Zero' },
    { id: 'CC-BY', label: 'Creative Commons BY' },
    { id: 'CC-BY-SA', label: 'Creative Commons BY-SA' },
  ];

  const durationOptions = [
    { id: 'all', label: 'All Durations' },
    { id: 'short', label: 'Short (< 5 min)' },
    { id: 'medium', label: 'Medium (5-20 min)' },
    { id: 'long', label: 'Long (> 20 min)' },
  ];

  const categoryOptions = [
    { id: 'all', label: 'All Categories' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'course', label: 'Course' },
    { id: 'lecture', label: 'Lecture' },
    { id: 'talk', label: 'Talk' },
    { id: 'documentary', label: 'Documentary' },
  ];

  const renderFilterSection = (
    id: string,
    title: string,
    icon: any,
    children: React.ReactNode
  ) => {
    const Icon = icon;
    const isExpanded = expandedSections.has(id);

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Icon className="h-5 w-5 text-gray-500 mr-3" />
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-gray-50"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderOptionButton = (
    option: { id: string; label: string; icon?: any; count?: number },
    currentValue: string,
    onChange: (value: string) => void,
    showCount = false
  ) => {
    const Icon = option.icon;
    const isSelected = currentValue === option.id;

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(option.id)}
        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center flex-1 min-w-0">
          {Icon && <Icon className="h-4 w-4 mr-3 flex-shrink-0" />}
          <span className="text-sm font-medium truncate">{option.label}</span>
        </div>
        {showCount && option.count !== undefined && (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
            isSelected
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {option.count >= 1000 ? `${(option.count / 1000).toFixed(1)}k` : option.count}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed lg:relative top-16 lg:top-0 left-0 h-[calc(100vh-4rem)] lg:h-screen w-80 lg:w-72 bg-white border-r border-gray-200 z-40 overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="flex items-center space-x-2">
            {Object.keys(filters).some(key => filters[key as keyof SearchFilters] !== 'all') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetFilters}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Reset all filters"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
            {onToggle && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggle}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Content Type Section */}
          {renderFilterSection(
            'content-type',
            'Content Type',
            Globe,
            <div className="p-4 space-y-2">
              {contentTypeOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.type || 'all',
                  (value) => handleFilterChange('type', value as any),
                  true
                )
              )}
            </div>
          )}

          {/* Time Period Section */}
          {renderFilterSection(
            'time',
            'Time Period',
            Calendar,
            <div className="p-4 space-y-2">
              {timeOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.time || 'all',
                  (value) => handleFilterChange('time', value)
                )
              )}
            </div>
          )}

          {/* Sort By Section */}
          {renderFilterSection(
            'sorting',
            'Sort By',
            BarChart3,
            <div className="p-4 space-y-2">
              {sortOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.sort || 'relevance',
                  (value) => handleFilterChange('sort', value)
                )
              )}
            </div>
          )}

          {/* Programming Language (Code only) */}
          {filters.type === 'code' && renderFilterSection(
            'language',
            'Programming Language',
            Code2,
            <div className="p-4 space-y-2">
              {languageOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.language || 'all',
                  (value) => handleFilterChange('language', value)
                )
              )}
            </div>
          )}

          {/* Video Duration (Videos only) */}
          {filters.type === 'videos' && renderFilterSection(
            'duration',
            'Video Duration',
            Clock,
            <div className="p-4 space-y-2">
              {durationOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.duration || 'all',
                  (value) => handleFilterChange('duration', value)
                )
              )}
            </div>
          )}

          {/* License (Datasets only) */}
          {filters.type === 'datasets' && renderFilterSection(
            'license',
            'License',
            Shield,
            <div className="p-4 space-y-2">
              {licenseOptions.map(option =>
                renderOptionButton(
                  option,
                  filters.license || 'all',
                  (value) => handleFilterChange('license', value)
                )
              )}
            </div>
          )}

          {/* Active Filters Summary */}
          {Object.keys(filters).some(key => filters[key as keyof SearchFilters] !== 'all') && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Active Filters
              </h3>
              <div className="space-y-2">
                {filters.type !== 'all' && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">Type: {filters.type}</span>
                    <button
                      onClick={() => handleFilterChange('type', 'all')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {filters.time !== 'all' && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">Time: {filters.time}</span>
                    <button
                      onClick={() => handleFilterChange('time', 'all')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {filters.language !== 'all' && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">Language: {filters.language}</span>
                    <button
                      onClick={() => handleFilterChange('language', 'all')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
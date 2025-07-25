import React, { useState, useEffect, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, Code, Globe, Calendar, Star, GitFork, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResult } from '../types';

interface FilterBarProps {
  filters: {
    language: string;
    type: string;
    time: string;
    repository: string;
    sort?: string;
  };
  onFilterChange: (type: string, value: string) => void;
  resultCount: number;
  activeTab: 'code';
  setActiveTab: React.Dispatch<React.SetStateAction<'code'>>;
  results?: SearchResult[];
  filterMetadata?: {
    languages: Record<string, number>;
    repositories: Record<string, { count: number; owner: string; avatarUrl?: string; stars?: number }>;
    timeRanges: Record<string, number>;
  };
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  resultCount = 0,
  activeTab,
  setActiveTab,
  results = [],
  filterMetadata
}) => {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [expandMobile, setExpandMobile] = useState(false);

  const safeTotal =
    typeof resultCount === 'number' && !isNaN(resultCount)
      ? resultCount
      : results
      ? results.length
      : 0;

  const toggleFilter = (filter: string) => {
    if (expandedFilter === filter) {
      setExpandedFilter(null);
    } else {
      setExpandedFilter(filter);
    }
  };

  const getCountsByProperty = (property: keyof SearchResult, limit = 10) => {
    if (!results || results.length === 0) return [];

    const counts: Record<string, number> = {};

    results.forEach(result => {
      const value = result[property];
      if (value && typeof value === 'string') {
        counts[value] = (counts[value] || 0) + 1;
      }
    });

    const sortedCounts = Object.entries(counts)
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return [
      {
        value: 'all',
        label: `All ${
          property === 'language'
            ? 'Languages'
            : property === 'source'
            ? 'Repositories'
            : property
        }`,
        count: safeTotal
      },
      ...sortedCounts
    ];
  };

  const languages = useMemo(() => {
    const languageCounts: Record<string, number> = {
      javascript: 0,
      typescript: 0,
      python: 0,
      java: 0,
      csharp: 0,
      cpp: 0,
      'c++': 0,
      ruby: 0,
      go: 0,
      rust: 0,
      php: 0,
      scala: 0,
      swift: 0,
      kotlin: 0,
      dart: 0
    };

    if (results && results.length > 0) {
      results.forEach(result => {
        if (result.language) {
          const lang = result.language.toLowerCase();
          const normalizedLang = lang === 'c#' ? 'csharp' : lang;

          if (normalizedLang in languageCounts) {
            languageCounts[normalizedLang]++;
          } else {
            languageCounts[normalizedLang] =
              (languageCounts[normalizedLang] || 0) + 1;
          }
        }
      });
    }

    const languageOptions = Object.entries(languageCounts)
      .filter(([_, count]) => count > 0)
      .map(([value, count]) => {
        let label = value.charAt(0).toUpperCase() + value.slice(1);

        if (value === 'javascript') label = 'JavaScript';
        if (value === 'typescript') label = 'TypeScript';
        if (value === 'csharp') label = 'C#';
        if (value === 'cpp' || value === 'c++') label = 'C++';

        return { value, label, count };
      })
      .sort((a, b) => b.count - a.count);

    if (languageOptions.length > 0) {
      return [
        { value: 'all', label: 'All Languages', count: safeTotal },
        ...languageOptions
      ];
    }

    return [
      { value: 'all', label: 'All Languages', count: safeTotal },
      { value: 'javascript', label: 'JavaScript', count: 0 },
      { value: 'typescript', label: 'TypeScript', count: 0 },
      { value: 'python', label: 'Python', count: 0 },
      { value: 'java', label: 'Java', count: 0 },
      { value: 'csharp', label: 'C#', count: 0 },
      { value: 'cpp', label: 'C++', count: 0 },
      { value: 'ruby', label: 'Ruby', count: 0 },
      { value: 'go', label: 'Go', count: 0 },
      { value: 'rust', label: 'Rust', count: 0 },
      { value: 'php', label: 'PHP', count: 0 }
    ];
  }, [results, safeTotal]);

  const times = useMemo(() => {
    return [
      { value: 'all', label: 'Any Time', count: safeTotal },
      { value: 'day', label: 'Last 24 Hours', count: 0 },
      { value: 'week', label: 'Last Week', count: 0 },
      { value: 'month', label: 'Last Month', count: 0 },
      { value: 'year', label: 'Last Year', count: 0 }
    ];
  }, [safeTotal]);

  const repositories = useMemo(() => {
    const repoOptions = new Map<string, number>();
    results.forEach(result => {
      if (result.source) {
        let repoName = result.source;
        if (repoName.includes('/')) {
          const parts = repoName.split('/');
          for (let i = 0; i < parts.length - 1; i++) {
            if (parts[i] && parts[i + 1]) {
              const possibleRepo = `${parts[i]}/${parts[i + 1]}`;
              if (
                possibleRepo.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)
              ) {
                repoName = possibleRepo;
                break;
              }
            }
          }
        }
        repoOptions.set(repoName, (repoOptions.get(repoName) || 0) + 1);
      }
    });

    const sortedRepos = Array.from(repoOptions.entries())
      .map(([value, count]) => ({
        value,
        label: value,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return [
      { value: 'all', label: 'All Repositories', count: safeTotal },
      ...sortedRepos
    ];
  }, [results, safeTotal]);

  const renderOptions = (
    options: { value: string; label: string; count?: number }[],
    type: string
  ) => {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {options.map(option => (
          <button
            key={option.value}
            className={`px-2.5 py-1 text-sm rounded-md transition-colors flex items-center justify-between ${
              filters[type as keyof typeof filters] === option.value
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onFilterChange(type, option.value)}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderListOptions = (
    options: { value: string; label: string; count?: number }[],
    type: string
  ) => {
    return (
      <div className="mt-2 space-y-1">
        {options.map(option => (
          <button
            key={option.value}
            className={`w-full px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
              filters[type as keyof typeof filters] === option.value
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            onClick={() => onFilterChange(type, option.value)}
          >
            <span>{option.label}</span>
            {option.count !== undefined && option.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {option.count.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  };

  const renderRepositoryOptions = (
    repositories: { value: string; label: string; count?: number }[]
  ) => {
    return (
      <div className="mt-2 space-y-1.5">
        {repositories.map(repo => (
          <button
            key={repo.value}
            className={`w-full px-2.5 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
              filters.repository === repo.value
                ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-100'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            onClick={() => onFilterChange('repository', repo.value)}
          >
            <div className="flex items-center">
              {repo.value !== 'all' && (
                <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center mr-2 text-gray-500">
                  {repo.label.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[180px]">{repo.label}</span>
            </div>

            {repo.count !== undefined && repo.count > 0 && (
              <div className="flex items-center">
                {repo.value !== 'all' && (
                  <span className="mr-2 text-gray-400 text-xs flex items-center">
                    <Star className="h-3 w-3 mr-0.5" />
                    {Math.floor(Math.random() * 1000) + 100}
                  </span>
                )}
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {repo.count.toLocaleString()}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  const tagFilters = useMemo(() => {
    const tags = new Set<string>();

    results.forEach(result => {
      const description = result.description || '';
      const keywords = [
        ...description.matchAll(
          /(#\w+|\b(?:3d|object-detection|deep-learning|point-cloud|robotics|voting)\b)/gi
        )
      ];

      keywords.forEach(match => {
        if (match[0]) {
          let tag = match[0].toLowerCase();
          if (tag.startsWith('#')) tag = tag.substring(1);
          tags.add(tag);
        }
      });
    });

    return Array.from(tags)
      .map(tag => ({
        value: tag,
        label: tag,
        count: results.filter(r =>
          (r.description || '').toLowerCase().includes(tag.toLowerCase())
        ).length
      }))
      .filter(tag => tag.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [results]);

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'recent', label: 'Recently Updated' },
    { value: 'stars-desc', label: 'Most Stars', icon: Star },
    { value: 'forks-desc', label: 'Most Forks', icon: GitFork },
    { value: 'stars-asc', label: 'Rising Stars', icon: Star },
    { value: 'matches', label: 'Most Matches' }
  ];

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          <strong>{safeTotal.toLocaleString()}</strong> results found
        </span>

      
      </div>

     
      <div className="md:hidden mb-4">
        <button
          onClick={() => setExpandMobile(!expandMobile)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          {expandMobile ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {expandMobile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border border-gray-200 rounded-lg shadow-sm mt-2 overflow-hidden"
            >
              <div className="p-3 border-b border-gray-200">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFilter('sort-mobile')}
                >
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Sort By</span>
                  </div>
                  {expandedFilter === 'sort-mobile' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                <AnimatePresence>
                  {expandedFilter === 'sort-mobile' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      <div className="mt-2 space-y-1">
                        {sortOptions.map(option => (
                          <button
                            key={option.value}
                            className={`w-full px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                              filters.sort === option.value
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => onFilterChange('sort', option.value)}
                          >
                            <div className="flex items-center">
                              {option.icon && (
                                <option.icon className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              <span>{option.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3 border-b border-gray-200">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFilter('language-mobile')}
                >
                  <div className="flex items-center space-x-2">
                    <Code className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Language</span>
                  </div>
                  {expandedFilter === 'language-mobile' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                <AnimatePresence>
                  {expandedFilter === 'language-mobile' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      {renderListOptions(languages, 'language')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3 border-b border-gray-200">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFilter('time-mobile')}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  {expandedFilter === 'time-mobile' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                <AnimatePresence>
                  {expandedFilter === 'time-mobile' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      {renderListOptions(times, 'time')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleFilter('repository-mobile')}
                >
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Repository</span>
                  </div>
                  {expandedFilter === 'repository-mobile' ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>

                <AnimatePresence>
                  {expandedFilter === 'repository-mobile' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      {renderRepositoryOptions(repositories)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters</span>
            </div>
            <button
              onClick={() => onFilterChange('reset', '')}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Reset All
            </button>
          </div>

          {tagFilters.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Popular Tags:</div>
              <div className="flex flex-wrap gap-1.5">
                {tagFilters.slice(0, 5).map(tag => (
                  <div
                    key={tag.value}
                    className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 flex items-center"
                  >
                    <span>{tag.label}</span>
                    <span className="ml-1.5 text-xs text-gray-500">
                      ({tag.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-gray-200">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter('sort')}
          >
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Sort By</span>
            </div>
            {expandedFilter === 'sort' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          <AnimatePresence>
            {expandedFilter === 'sort' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2"
              >
                <div className="mt-2 space-y-1">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className={`w-full px-2.5 py-1.5 text-sm rounded-md transition-colors flex items-center justify-between ${
                        filters.sort === option.value
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => onFilterChange('sort', option.value)}
                    >
                      <div className="flex items-center">
                        {option.icon && (
                          <option.icon className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter('language')}
          >
            <div className="flex items-center space-x-2">
              <Code className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Language</span>
            </div>
            {expandedFilter === 'language' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          <AnimatePresence>
            {expandedFilter === 'language' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2"
              >
                {renderListOptions(languages, 'language')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter('time')}
          >
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Time</span>
            </div>
            {expandedFilter === 'time' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          <AnimatePresence>
            {expandedFilter === 'time' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2"
              >
                {renderListOptions(times, 'time')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleFilter('repository')}
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Repository</span>
            </div>
            {expandedFilter === 'repository' ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>

          <AnimatePresence>
            {expandedFilter === 'repository' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2"
              >
                {renderRepositoryOptions(repositories)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-500 mb-2">Search Syntax Tips:</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
            "exact phrase"
          </div>
          <div className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
            language:python
          </div>
          <div className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
            repo:facebook/react
          </div>
          <div className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-600">
            -exclude
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterBar;
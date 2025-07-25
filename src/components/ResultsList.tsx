import React, { useState, useEffect } from 'react';
import { SearchResult } from '../types';
import { 
  Github, Star, GitFork, Eye, Clock, Code, File, FileText, 
  Hash, Calendar, ExternalLink, Bookmark, Award, Terminal, 
  Tag, AlertCircle, ShieldCheck, CaseSensitive, RegexIcon, 
  FileSearch, Settings, Sparkles, Database, ChevronDown, FileCode, Package 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Add search options interface
interface SearchOptions {
  matchWholeWord: boolean;
  matchCase: boolean;
  useRegex: boolean;
  highlightMatchesOnly: boolean;
}

// Update the component's prop interface
interface ResultsListProps {
  results: SearchResult[];
  searchQuery?: string;
}

// Add this component to the top of search results to show API sources
const ApiSourcesInfo = ({ results }: { results: SearchResult[] }) => {
  // Extract unique API sources
  const apiSources = results
    .filter(result => result.apiSource)
    .reduce((sources, result) => {
      const source = result.apiSource;
      if (!sources.some(s => s.url === source.url)) {
        sources.push(source);
      }
      return sources;
    }, [] as { name: string; url: string }[]);
    
  if (apiSources.length === 0) return null;
  
  return (
    <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm">
      <details className="group">
        <summary className="flex items-center cursor-pointer text-gray-700 dark:text-gray-300">
          <Database className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          <span>Data sources: {apiSources.length} APIs</span>
          <ChevronDown className="h-4 w-4 ml-2 transform group-open:rotate-180 transition-transform" />
        </summary>
        <div className="pl-6 mt-2 space-y-1">
          {apiSources.map((source, index) => (
            <div key={index} className="flex items-center text-gray-600 dark:text-gray-400">
              <Database className="h-3.5 w-3.5 mr-2" />
              <span className="mr-2">{source.name}:</span>
              <a 
                href={source.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {source.url.split('/').slice(3).join('/')}
              </a>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

// Add this to show combined metrics at the top of results
const ResultsMetrics = ({ results }: { results: SearchResult[] }) => {
  const codeCount = results.filter(r => r.type === 'code').length;
  const repoCount = results.filter(r => r.type === 'repository').length;
  
  return (
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5">
            <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{codeCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Code files</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1.5">
            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{repoCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Repositories</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1.5">
            <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{results.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total results</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultsList: React.FC<ResultsListProps> = ({ results, searchQuery = '' }) => {
  // Add search options state
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    matchWholeWord: false,
    matchCase: false,
    useRegex: false,
    highlightMatchesOnly: true
  });
  
  // Add these functions to handle search options
  const toggleOption = (option: keyof SearchOptions) => {
    setSearchOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  // Create a regex based on the current search options
  const createSearchRegex = (query: string): RegExp | null => {
    if (!query?.trim()) return null;
    
    try {
      let pattern: string;
      
      if (searchOptions.useRegex) {
        // Use the query directly as a regex pattern
        pattern = query;
      } else {
        // Escape regex special characters
        pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // If match whole word is enabled, add word boundary markers
        if (searchOptions.matchWholeWord) {
          pattern = `\\b${pattern}\\b`;
        }
        
        // Split into terms for multi-word search
        if (!searchOptions.matchWholeWord) {
          const terms = pattern.split(/\s+/).filter(t => t.length > 0);
          if (terms.length > 1) {
            pattern = `(${terms.join('|')})`;
          }
        }
      }
      
      // Create the regex with case sensitivity option
      return new RegExp(pattern, searchOptions.matchCase ? 'g' : 'gi');
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return null;
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300 dark:border-yellow-800/30',
      typescript: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-800/30',
      python: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-800/20 dark:text-green-300 dark:border-green-800/30',
      rust: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-300 dark:border-orange-800/30',
      java: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-800/20 dark:text-red-300 dark:border-red-800/30',
      go: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-800/20 dark:text-cyan-300 dark:border-cyan-800/30',
      json: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-800/30',
      c: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-800/30',
      'c++': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800/20 dark:text-purple-300 dark:border-purple-800/30',
      'c#': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-800/30',
      html: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-300 dark:border-orange-800/30',
      css: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-800/20 dark:text-pink-300 dark:border-pink-800/30',
      php: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300 dark:border-indigo-800/30',
      ruby: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-800/20 dark:text-red-300 dark:border-red-800/30',
      swift: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-800/20 dark:text-orange-300 dark:border-orange-800/30',
      kotlin: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-800/20 dark:text-purple-300 dark:border-purple-800/30',
      dart: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-800/30',
      markdown: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-800/30',
      md: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-800/30',
    };
    
    return colors[language?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-300 dark:border-gray-800/30';
  };

// Enhanced Indian number formatting with abbreviated values
const formatIndianNumberSystem = (num: number | undefined): string => {
  if (num === undefined || num === null) return "0";
  
  if (num >= 10000000) { // 1 crore
    return `${(num / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  } else if (num >= 100000) { // 1 lakh
    return `${(num / 100000).toFixed(1).replace(/\.0$/, '')} L`;
  } else if (num >= 1000) { // 1 thousand
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  } else {
    return num.toLocaleString('en-IN');
  }
};

// Update the formatDate function to use the actual timestamp from the result

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Unknown date";
    }
    
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays < 1) {
      // Less than 24 hours ago - show hours
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      if (hours < 1) {
        const minutes = Math.floor(diffTime / (1000 * 60));
        return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
      }
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 2) {
      return "Yesterday";
    } else if (diffDays < 7) {
      const days = Math.floor(diffDays);
      return `${days} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return "Invalid date";
  }
};

  // Highlight matched terms in text
  const highlightText = (text: string, query: string) => {
    if (!query?.trim() || !text) return text;
    
    const queryTerms = query.trim().split(/\s+/).filter(term => term.length > 2);
    if (queryTerms.length === 0) return text;

    const regex = new RegExp(`(${queryTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? 
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-sm px-0.5">{part}</mark> : 
            <span key={i}>{part}</span>
        )}
      </>
    );
  };

  // Add same highlighting to repository name
  const highlightRepoName = (repoName: string, query: string) => {
    if (!query?.trim() || !repoName) return repoName;
    
    // For repository names, we want to highlight whole words/segments
    const queryParts = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 2);
    if (queryParts.length === 0) return repoName;
    
    // Check if any part of the query is in the repo name
    let highlightedName = repoName;
    queryParts.forEach(part => {
      const regex = new RegExp(`(${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedName = highlightedName.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-sm px-0.5">$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedName }} />;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Use the original getCodeSnippet function but modify for improved line-only highlighting
  const getEnhancedCodeSnippet = (result: SearchResult, query: string) => {
    if (!result.snippet) return null;
    
    const codeContent = result.snippet;
    const lineNumbers = result.lineNumbers || [];
    
    // Get the file extension for language detection
    let language = result.language || 'text';
    if (result.path) {
      const fileExt = result.path.split('.').pop()?.toLowerCase();
      if (fileExt) {
        language = fileExt;
      }
    }
    
    // Create a search regex based on current options
    const searchRegex = createSearchRegex(query);

    // If we have pre-calculated line numbers from the API
    if (lineNumbers.length > 0) {
      const lines = codeContent.split('\n');
      
      // Process each line with its line number
      const processedLines = lines.map((line, idx) => {
        const lineNum = lineNumbers[idx];
        
        // Separator line
        if (lineNum === -1) {
          return (
            <div key={`sep-${idx}`} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1 border-t border-gray-200 dark:border-gray-700">
              ...
            </div>
          );
        }
        
        // Check if line contains search query based on options
        const isMatchingLine = searchRegex ? searchRegex.test(line) : false;
        
        // Skip non-matching lines if highlightMatchesOnly is enabled
        if (searchOptions.highlightMatchesOnly && !isMatchingLine) {
          return null;
        }
        
        // Highlight matching terms in the line
        let highlightedLine = line;
        if (isMatchingLine && searchRegex) {
          // Reset regex lastIndex
          searchRegex.lastIndex = 0;
          
          // Apply highlighting to matches
          highlightedLine = line.replace(searchRegex, 
            '<mark class="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-sm px-0.5">$&</mark>'
          );
        }
        
        return (
          <div 
            key={`line-${idx}`} 
            className={`flex ${isMatchingLine ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-2 border-yellow-400 dark:border-yellow-600' : ''} hover:bg-gray-100 dark:hover:bg-gray-800/60`}
          >
            <div className="text-right text-gray-400 dark:text-gray-500 select-none w-[3rem] pr-2 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
              {lineNum}
            </div>
            <div 
              className="pl-3 whitespace-pre-wrap w-full overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: highlightedLine }}
            />
          </div>
        );
      }).filter(Boolean); // Remove null items when highlightMatchesOnly is true
      
      // Calculate match count
      const matchCount = searchRegex ? 
        lines.filter((line, idx) => lineNumbers[idx] !== -1 && searchRegex.test(line)).length : 0;
      
      return (
        <div className="border dark:border-gray-700 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-900 my-3">
          <div className="bg-gray-800 dark:bg-gray-900 text-gray-200 dark:text-gray-300 px-4 py-2 text-xs flex justify-between items-center">
            {/* Repository info in code header */}
            <div className="flex items-center overflow-hidden">
              <div className="flex-shrink-0 mr-3">
                {result.owner?.avatar_url ? (
                  <img 
                    src={result.owner.avatar_url} 
                    alt={result.owner.login} 
                    className="h-5 w-5 rounded-full border border-gray-600"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-blue-900/50 flex items-center justify-center">
                    <Code className="h-3 w-3 text-blue-400" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{result.source}</span>
                  {/* Combined stats compact display */}
                  <div className="flex space-x-2">
                    {result.stars !== undefined && (
                      <span className="flex items-center text-yellow-400" title={`${result.stars.toLocaleString()} stars`}>
                        <Star className="h-3 w-3 mr-0.5" fill="currentColor" />
                        <span className="text-gray-300 text-xs">{formatIndianNumberSystem(result.stars)}</span>
                      </span>
                    )}
                    
                    {result.forks !== undefined && (
                      <span className="flex items-center text-blue-400" title={`${result.forks.toLocaleString()} forks`}>
                        <GitFork className="h-3 w-3 mr-0.5" />
                        <span className="text-gray-300 text-xs">{formatIndianNumberSystem(result.forks)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center font-mono">
                    {getFileIcon(result.path)}
                    <span className="ml-1 truncate text-xs text-gray-300">{result.path || 'code snippet'}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(result.timestamp)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {language !== 'text' && (
                <span className={`px-2 py-0.5 rounded text-xs border ${getLanguageColor(language)}`}>
                  {language}
                </span>
              )}
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 p-1 hover:bg-gray-700 rounded"
              >
                <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
          
          <div className="overflow-x-auto font-mono text-sm dark:text-gray-300 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {processedLines.length > 0 ? processedLines : (
              <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                No matching lines found with current search options
              </div>
            )}
          </div>
          
          <div className="py-2 px-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center">
                <span>
                  {matchCount} {matchCount === 1 ? 'match' : 'matches'} found
                </span>
              </div>
              
              {/* Compact repository stats */}
              <div className="flex flex-wrap gap-2">
                {/* Topics tags */}
                {result.topics && result.topics.length > 0 && result.topics.slice(0, 2).map((topic, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30"
                  >
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {topic}
                  </span>
                ))}
                
                {/* Show more tag count */}
                {result.topics && result.topics.length > 2 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 py-0.5">
                    +{result.topics.length - 2}
                  </span>
                )}
                
                {/* License if available */}
                {result.license && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 py-0.5 flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    {result.license.length > 8 ? result.license.substring(0, 8) + '...' : result.license}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback for snippets without line numbers
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 my-3 font-mono text-sm overflow-x-auto dark:text-gray-300">
        <div className="mb-3 flex flex-col">
          {/* Repository header for inline code */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {result.owner?.avatar_url ? (
                <img 
                  src={result.owner.avatar_url} 
                  alt={result.owner.login} 
                  className="h-5 w-5 rounded-full mr-2 border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <Github className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{result.source}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {result.stars !== undefined && (
                <span className="flex items-center text-yellow-600 dark:text-yellow-500">
                  <Star className="h-3.5 w-3.5 mr-0.5" fill="currentColor" />
                  <span className="text-xs">{formatIndianNumberSystem(result.stars)}</span>
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(result.timestamp)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              {getFileIcon(result.path)}
              <span className="ml-1.5 truncate">{result.path || 'Code Snippet'}</span>
            </div>
            <a 
              href={result.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            </a>
          </div>
        </div>
        
        {/* Use the search regex for highlighting */}
        {(() => {
          const searchRegex = createSearchRegex(query);
          if (!searchRegex) return codeContent;
          
          // For inline code, split by lines to highlight only matching lines
          if (searchOptions.highlightMatchesOnly) {
            const lines = codeContent.split('\n');
            const matchingLines = lines.map((line, idx) => {
              if (!searchRegex.test(line)) return null;
              
              // Reset regex lastIndex
              searchRegex.lastIndex = 0;
              const highlightedLine = line.replace(
                searchRegex, 
                '<mark class="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-sm px-0.5">$&</mark>'
              );
              
              return (
                <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/10 border-l-2 border-yellow-400 dark:border-yellow-600 pl-2 py-0.5">
                  <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                </div>
              );
            }).filter(Boolean);
            
            return matchingLines.length > 0 ? matchingLines : (
              <div className="text-gray-500 dark:text-gray-400 text-center py-3">
                No matching lines found with current search options
              </div>
            );
          }
          
          // Regular highlighting for whole content
          return <span dangerouslySetInnerHTML={{ 
            __html: codeContent.replace(
              searchRegex, 
              '<mark class="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 rounded-sm px-0.5">$&</mark>'
            ) 
          }} />;
        })()}
      </div>
    );
  };

  // Get file icon based on extension
  const getFileIcon = (path: string | undefined) => {
    if (!path) return <File className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
    
    const ext = path.split('.').pop()?.toLowerCase();
    if (ext === 'md' || ext === 'markdown') return <FileText className="h-4 w-4 text-blue-400 dark:text-blue-500" />;
    if (ext === 'js' || ext === 'jsx') return <Code className="h-4 w-4 text-yellow-400 dark:text-yellow-500" />;
    if (ext === 'ts' || ext === 'tsx') return <Code className="h-4 w-4 text-blue-400 dark:text-blue-500" />;
    if (ext === 'py') return <Terminal className="h-4 w-4 text-green-400 dark:text-green-500" />;
    if (ext === 'rb') return <Code className="h-4 w-4 text-red-400 dark:text-red-500" />;
    if (ext === 'go') return <Code className="h-4 w-4 text-cyan-400 dark:text-cyan-500" />;
    if (ext === 'java') return <Code className="h-4 w-4 text-orange-400 dark:text-orange-500" />;
    return <File className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
  };
  
  // Get the file count message for repositories with code results
  const getFileCountMessage = (result: SearchResult) => {
    if (result.type === 'repository' && result.path) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
          <Terminal className="h-3.5 w-3.5 mr-1" />
          File with matches: <span className="font-mono ml-1">{result.path}</span>
        </span>
      );
    }
    return null;
  };

// Enhanced file count message with repo stats
const getRepoDetails = (result: SearchResult) => {
  // If this is a repository result or has detailed stats
  if (result.stars !== undefined || result.forks !== undefined || result.watchers !== undefined) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
        {/* Star count with Indian numbering and tooltip */}
        {result.stars !== undefined && (
          <div 
            className="flex items-center bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 px-2 py-0.5 rounded-md border border-yellow-100 dark:border-yellow-800/30"
            title={`${result.stars.toLocaleString()} stars`}
          >
            <Star className="h-3.5 w-3.5 mr-1 text-yellow-500 dark:text-yellow-400" fill="currentColor" />
            <span className="font-medium">{formatIndianNumberSystem(result.stars)}</span>
          </div>
        )}
        
        {/* Fork count */}
        {result.forks !== undefined && (
          <div 
            className="flex items-center bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/30"
            title={`${result.forks.toLocaleString()} forks`}
          >
            <GitFork className="h-3.5 w-3.5 mr-1 text-blue-500 dark:text-blue-400" />
            <span className="font-medium">{formatIndianNumberSystem(result.forks)}</span>
          </div>
        )}
        
        {/* Watchers count */}
        {result.watchers !== undefined && (
          <div 
            className="flex items-center bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 px-2 py-0.5 rounded-md border border-green-100 dark:border-green-800/30"
            title={`${result.watchers.toLocaleString()} watchers`}
          >
            <Eye className="h-3.5 w-3.5 mr-1 text-green-500 dark:text-green-400" />
            <span className="font-medium">{formatIndianNumberSystem(result.watchers)}</span>
          </div>
        )}
        
        {/* Open issues */}
        {result.openIssues !== undefined && (
          <div 
            className="flex items-center bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-100 dark:border-purple-800/30"
            title={`${result.openIssues.toLocaleString()} open issues`}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1 text-purple-500 dark:text-purple-400" />
            <span className="font-medium">{formatIndianNumberSystem(result.openIssues)}</span>
          </div>
        )}
        
        {/* License information */}
        {result.license && (
          <div 
            className="flex items-center bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700"
            title={result.license}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
            <span className="font-medium">
              {result.license.length > 10 
                ? `${result.license.substring(0, 10)}...` 
                : result.license}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Calculate repository score for better relevance sorting
const calculateRepoScore = (result: SearchResult): number => {
  let score = 0;
  
  // Stars have the highest weight
  if (result.stars) {
    score += result.stars * 3;
  }
  
  // Forks indicate code reuse
  if (result.forks) {
    score += result.forks * 2;
  }
  
  // Watchers indicate ongoing interest
  if (result.watchers) {
    score += result.watchers;
  }
  
  // Open issues can be either good (active project) or bad (problems)
  // We'll consider fewer open issues better for now
  if (result.openIssues !== undefined) {
    // Cap the negative impact of open issues
    score -= Math.min(result.openIssues / 10, 20);
  }
  
  // Recent updates are good
  if (result.timestamp) {
    const ageInDays = (Date.now() - new Date(result.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    // More recent updates get higher score, max 50 points for very recent updates
    score += Math.max(0, 50 - ageInDays / 2);
  }
  
  return Math.max(0, score); // Ensure score is not negative
};

// Get relevance score formatting
const getScoreBadge = (result: SearchResult) => {
  const score = calculateRepoScore(result);
  
  let scoreColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  
  if (score > 10000) {
    scoreColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  } else if (score > 1000) {
    scoreColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
  } else if (score > 100) {
    scoreColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  }
  
  return (
    <div 
      className={`px-2 py-0.5 rounded text-xs font-medium ${scoreColor}`} 
      title={`Relevance score: ${Math.round(score)}`}
    >
      <Sparkles className="h-3 w-3 inline mr-1" />
      {score > 1000 ? `${(score / 1000).toFixed(1)}k` : Math.round(score)}
    </div>
  );
};

  return (
    <div className="w-full max-w-full">
      <div className="mb-4">
        {/* Search result count and options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-gray-700 dark:text-gray-300 text-sm font-medium">
            {results.length} search results for <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">{searchQuery}</span>
          </h2>
          
          {/* Search options */}
          <div className="flex items-center flex-wrap gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <button 
              onClick={() => toggleOption('matchWholeWord')} 
              className={`flex items-center text-xs px-2 py-1 rounded ${
                searchOptions.matchWholeWord 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title="Match whole words only"
            >
              <FileSearch className="h-3.5 w-3.5 mr-1.5" />
              Whole Word
            </button>
            
            <button 
              onClick={() => toggleOption('matchCase')} 
              className={`flex items-center text-xs px-2 py-1 rounded ${
                searchOptions.matchCase 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title="Match case"
            >
              <CaseSensitive className="h-3.5 w-3.5 mr-1.5" />
              Match Case
            </button>
            
            <button 
              onClick={() => toggleOption('useRegex')} 
              className={`flex items-center text-xs px-2 py-1 rounded ${
                searchOptions.useRegex 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title="Use regular expression"
            >
              <RegexIcon className="h-3.5 w-3.5 mr-1.5" />
              Regex
            </button>
            
            <button 
              onClick={() => toggleOption('highlightMatchesOnly')} 
              className={`flex items-center text-xs px-2 py-1 rounded ${
                searchOptions.highlightMatchesOnly 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
              }`}
              title="Show only matching lines"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Matching Lines Only
            </button>
          </div>
        </div>
        
        {/* Active filters summary */}
        {(searchOptions.matchCase || searchOptions.matchWholeWord || searchOptions.useRegex) && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-2 items-center">
            <span>Active filters:</span>
            {searchOptions.matchCase && (
              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                Case Sensitive
              </span>
            )}
            {searchOptions.matchWholeWord && (
              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                Whole Words
              </span>
            )}
            {searchOptions.useRegex && (
              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                Regular Expression
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Add API sources info */}
      <div className="mb-6">
        <ApiSourcesInfo results={results} />
      </div>
      
      {/* Add combined metrics */}
      <ResultsMetrics results={results} />
      
      {/* Sort results by relevance score */}
      <motion.div 
        className="grid grid-cols-1 gap-4 w-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {results
          // Sort results by calculated score for relevance
          .sort((a, b) => calculateRepoScore(b) - calculateRepoScore(a))
          .map((result) => (
          <motion.div 
            key={result.id} 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md border border-gray-100 dark:border-gray-700 transition-shadow w-full"
            variants={item}
            whileHover={{ scale: 1.005 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {/* Card header with repository info */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-start justify-between">
                {/* Left section: Repository title and details */}
                <div className="flex items-start space-x-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    {result.owner?.avatar_url ? (
                      <img 
                        src={result.owner.avatar_url} 
                        alt={result.owner.login} 
                        className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700"
                      />
                    ) : result.type === 'code' ? (
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-1"
                      >
                        {highlightRepoName(result.title || result.source, searchQuery)}
                      </a>
                      
                      {/* Add relevance score badge */}
                      {getScoreBadge(result)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Github className="h-3.5 w-3.5 mr-1" />
                        <span className="truncate max-w-[150px]">{result.owner?.login || result.source}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{formatDate(result.timestamp)}</span>
                      </div>
                      
                      {result.language && (
                        <div className="flex items-center">
                          <Terminal className="h-3.5 w-3.5 mr-1" />
                          <span className="font-medium" style={{ 
                            color: getLanguageColor(result.language).includes('text-') 
                              ? getLanguageColor(result.language).split('text-')[1].split(' ')[0] 
                              : undefined 
                          }}>
                            {result.language}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced repository metrics */}
                    {getRepoDetails(result)}
                    
                    {/* File path for code results */}
                    {result.type === 'code' && result.path && (
                      <div className="mt-2 flex items-center text-xs">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 font-mono text-gray-700 dark:text-gray-300 max-w-full overflow-hidden">
                          {getFileIcon(result.path)}
                          <span className="ml-1.5 truncate">{result.path}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Right section: Language badge highlighted */}
                {result.language && (
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getLanguageColor(result.language)}`}>
                      {result.language}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Repository description */}
            {result.description && (
              <div className="px-4 py-2">
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {highlightText(result.description, searchQuery)}
                </p>
              </div>
            )}
            
            {/* Code snippet with highlighting */}
            <div className="px-4">
              {(result.snippet || result.code) && getEnhancedCodeSnippet(result, searchQuery)}
            </div>
            
            {/* Footer with tags and buttons */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-y-2">
              <div className="flex flex-wrap gap-1.5">
                {/* Tags/topics */}
                {result.topics && result.topics.length > 0 && result.topics.slice(0, 4).map((topic, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {topic}
                  </span>
                ))}
                
                {/* Show more tag count */}
                {result.topics && result.topics.length > 4 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{result.topics.length - 4} more
                  </span>
                )}
              </div>
              
              {/* View button */}
              <div className="flex items-center gap-2">
                <a 
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {result.type === 'code' ? (
                    <>
                      <File className="h-3.5 w-3.5 mr-1.5" />
                      View File
                    </>
                  ) : (
                    <>
                      <Github className="h-3.5 w-3.5 mr-1.5" />
                      View Repository
                    </>
                  )}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ResultsList;
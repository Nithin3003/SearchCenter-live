import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Github,
  Star,
  GitFork,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code2,
  Calendar,
  User
} from 'lucide-react';
import { CodeResult } from '../../services/enhancedSearchService';

interface CodePreviewProps {
  result: CodeResult;
  searchQuery?: string;
  onPreview?: () => void;
}

export default function CodePreview({ result, searchQuery, onPreview }: CodePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (result.codeSnippet) {
      await navigator.clipboard.writeText(result.codeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-400',
      'TypeScript': 'bg-blue-400',
      'Python': 'bg-green-400',
      'Java': 'bg-orange-400',
      'C++': 'bg-purple-400',
      'C': 'bg-gray-400',
      'C#': 'bg-indigo-400',
      'PHP': 'bg-purple-400',
      'Ruby': 'bg-red-400',
      'Go': 'bg-cyan-400',
      'Rust': 'bg-orange-500',
      'Swift': 'bg-orange-400',
      'Kotlin': 'bg-purple-500',
      'HTML': 'bg-orange-500',
      'CSS': 'bg-blue-500',
      'SCSS': 'bg-pink-500',
      'SQL': 'bg-blue-600',
    };

    return colors[language] || 'bg-gray-400';
  };

  const formatFileSize = (stars: number) => {
    if (stars >= 1000) {
      return `${(stars / 1000).toFixed(1)}k`;
    }
    return stars.toString();
  };

  const highlightText = (text: string, query?: string) => {
    if (!query?.trim()) return text;

    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getLanguageColor(result.language)}`} />
              <span className="text-sm font-medium text-gray-600">{result.language}</span>
              {result.repository && (
                <>
                  <span className="text-gray-400">•</span>
                  <a
                    href={`https://github.com/${result.repository}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  >
                    <Github className="h-3 w-3 mr-1" />
                    {result.repository}
                  </a>
                </>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                {highlightText(result.title, searchQuery)}
                <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </h3>

            {result.description && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {highlightText(result.description, searchQuery)}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy code"
            >
              {copied ? (
                <div className="h-4 w-4 text-green-600">✓</div>
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Code Snippet */}
      {result.codeSnippet && (
        <div className="relative">
          <div className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-96' : 'max-h-32'
          }`}>
            <pre className="bg-gray-900 text-gray-100 p-4 text-sm font-mono overflow-x-auto">
              <code className="language-{result.language.toLowerCase()}">
                {result.codeSnippet}
              </code>
            </pre>
          </div>

          {/* Gradient overlay when collapsed */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent" />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {result.author}
            </div>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(result.lastUpdated).toLocaleDateString()}
            </div>

            <div className="flex items-center space-x-3">
              {result.stars > 0 && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                  {formatFileSize(result.stars)}
                </div>
              )}

              {result.forks > 0 && (
                <div className="flex items-center">
                  <GitFork className="h-4 w-4 mr-1 text-blue-500" />
                  {formatFileSize(result.forks)}
                </div>
              )}
            </div>
          </div>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Code2 className="h-4 w-4 mr-2" />
            View Code
          </motion.a>
        </div>

        {result.filePath && (
          <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
            📁 {result.filePath}
          </div>
        )}
      </div>
    </motion.div>
  );
}
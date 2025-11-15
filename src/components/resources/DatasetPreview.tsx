import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Download,
  ExternalLink,
  Users,
  FileText,
  BarChart3,
  Shield,
  Calendar,
  Eye,
  BookmarkPlus,
  Share2
} from 'lucide-react';
import { DatasetResult } from '../../services/enhancedSearchService';

interface DatasetPreviewProps {
  result: DatasetResult;
  searchQuery?: string;
  onPreview?: () => void;
}

export default function DatasetPreview({ result, searchQuery, onPreview }: DatasetPreviewProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formatDownloadCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getLicenseColor = (license: string) => {
    const colors: { [key: string]: string } = {
      'MIT': 'bg-green-100 text-green-700',
      'Apache-2.0': 'bg-blue-100 text-blue-700',
      'GPL-3.0': 'bg-red-100 text-red-700',
      'CC0': 'bg-purple-100 text-purple-700',
      'CC-BY': 'bg-orange-100 text-orange-700',
      'CC-BY-SA': 'bg-yellow-100 text-yellow-700',
      'CC-BY-NC': 'bg-pink-100 text-pink-700',
    };

    return colors[license] || 'bg-gray-100 text-gray-700';
  };

  const getLicenseIcon = (license: string) => {
    // Different licenses could have different icons
    return <Shield className="h-4 w-4" />;
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

  const generatePreviewData = () => {
    // Generate some sample preview data for demonstration
    return [
      { id: 1, column1: 'Sample Value 1', column2: 'Sample Value 2', column3: 'Sample Value 3' },
      { id: 2, column1: 'Sample Value 4', column2: 'Sample Value 5', column3: 'Sample Value 6' },
      { id: 3, column1: 'Sample Value 7', column2: 'Sample Value 8', column3: 'Sample Value 9' },
      { id: 4, column1: 'Sample Value 10', column2: 'Sample Value 11', column3: 'Sample Value 12' },
      { id: 5, column1: 'Sample Value 13', column2: 'Sample Value 14', column3: 'Sample Value 15' },
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
    >
      {/* Header with Image */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 rounded-t-xl overflow-hidden">
          {result.coverImage ? (
            <img
              src={result.coverImage}
              alt={result.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Database className="h-16 w-16 text-blue-400" />
            </div>
          )}
        </div>

        {/* License Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium flex items-center ${getLicenseColor(result.license)}`}>
          {getLicenseIcon(result.license)}
          <span className="ml-1">{result.license}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start justify-between"
          >
            <span className="flex-1 mr-2">
              {highlightText(result.title, searchQuery)}
            </span>
            <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {highlightText(result.description, searchQuery)}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <Download className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Downloads</span>
            </div>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {formatDownloadCount(result.downloadCount)}
            </p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">File Size</span>
            </div>
            <p className="text-lg font-bold text-green-900 mt-1">
              {result.fileSize}
            </p>
          </div>

          {(result.rows > 0 || result.columns > 0) && (
            <>
              {result.rows > 0 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="text-xs text-purple-600 font-medium">Rows</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900 mt-1">
                    {result.rows.toLocaleString()}
                  </p>
                </div>
              )}

              {result.columns > 0 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Database className="h-5 w-5 text-orange-600" />
                    <span className="text-xs text-orange-600 font-medium">Columns</span>
                  </div>
                  <p className="text-lg font-bold text-orange-900 mt-1">
                    {result.columns}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Author & Organization */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{result.author}</span>
            {result.organization && (
              <>
                <span className="mx-1">•</span>
                <span>{result.organization}</span>
              </>
            )}
          </div>

          <div className="flex items-center text-gray-500">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Updated recently</span>
          </div>
        </div>

        {/* Tags */}
        {result.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {result.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 4 && (
              <span className="text-xs text-gray-400">
                +{result.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Preview Table */}
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Hide' : 'Show'} Data Preview
          </motion.button>

          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Column 1</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Column 2</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Column 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {generatePreviewData().map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{row.column1}</td>
                        <td className="px-3 py-2 text-gray-900">{row.column2}</td>
                        <td className="px-3 py-2 text-gray-900">{row.column3}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Dataset
          </motion.a>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <BookmarkPlus className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share dataset"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
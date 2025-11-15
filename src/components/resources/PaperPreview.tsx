import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ExternalLink,
  Download,
  Users,
  Calendar,
  Quote,
  BookOpen,
  Award,
  BookmarkPlus,
  Share2,
  Link2,
  Building,
  TrendingUp
} from 'lucide-react';
import { PaperResult } from '../../services/enhancedSearchService';

interface PaperPreviewProps {
  result: PaperResult;
  searchQuery?: string;
  onPreview?: () => void;
}

export default function PaperPreview({ result, searchQuery, onPreview }: PaperPreviewProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatCitationCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getImpactColor = (citations: number) => {
    if (citations >= 1000) return 'bg-green-100 text-green-700 border-green-200';
    if (citations >= 100) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (citations >= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getImpactLabel = (citations: number) => {
    if (citations >= 1000) return 'High Impact';
    if (citations >= 100) return 'Moderate Impact';
    if (citations >= 10) return 'Growing Impact';
    return 'Emerging';
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

  const truncateAbstract = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDownloadPDF = async () => {
    if (result.pdfUrl) {
      window.open(result.pdfUrl, '_blank');
    } else {
      // Fallback to main URL if PDF URL is not available
      window.open(result.url, '_blank');
    }
  };

  const getYearFromPublication = (year: number) => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age === 0) return 'Published this year';
    if (age === 1) return 'Published last year';
    if (age <= 5) return `Published ${age} years ago`;
    return `Published in ${year}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start justify-between"
              >
                <span className="flex-1 mr-2">
                  {highlightText(result.title, searchQuery)}
                </span>
                <ExternalLink className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </h3>

            {/* Authors */}
            <div className="flex items-center mb-3">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <div className="flex flex-wrap gap-2">
                {result.authors.slice(0, 3).map((author, index) => (
                  <span key={index} className="text-sm text-gray-700">
                    {author}
                    {index < Math.min(result.authors.length - 1, 2) && ','}
                  </span>
                ))}
                {result.authors.length > 3 && (
                  <span className="text-sm text-gray-500">
                    {' '}& {result.authors.length - 3} more authors
                  </span>
                )}
              </div>
            </div>

            {/* Publication Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {result.publicationVenue}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {result.year}
                </div>
              </div>

              {/* Impact Badge */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(result.citationCount)}`}>
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {getImpactLabel(result.citationCount)}
              </div>
            </div>

            {/* DOI Link */}
            {result.doi && (
              <div className="flex items-center">
                <Link2 className="h-4 w-4 text-gray-500 mr-2" />
                <a
                  href={`https://doi.org/${result.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  DOI: {result.doi}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Abstract */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Quote className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Abstract</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {highlightText(truncateAbstract(result.abstract), searchQuery)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCitationCount(result.citationCount)}
              </span>
            </div>
            <p className="text-xs text-gray-600">Citations</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-5 w-5 text-blue-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {result.authors.length}
              </span>
            </div>
            <p className="text-xs text-gray-600">Authors</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <BookOpen className="h-5 w-5 text-green-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {new Date().getFullYear() - result.year}
              </span>
            </div>
            <p className="text-xs text-gray-600">Years Old</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {result.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 5 && (
              <span className="text-xs text-gray-500 px-2">
                +{result.tags.length - 5} more tags
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              disabled={!result.pdfUrl && !result.url}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {result.pdfUrl ? 'Download PDF' : 'View Paper'}
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Online
            </motion.a>
          </div>

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
              title={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
            >
              <BookmarkPlus className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share paper"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          {getYearFromPublication(result.year)} •
          {result.citationCount >= 10 && ` Highly cited with ${formatCitationCount(result.citationCount)} citations • `}
          Available in {result.publicationVenue}
        </div>
      </div>
    </motion.div>
  );
}
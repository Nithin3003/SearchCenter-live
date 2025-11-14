import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  ExternalLink,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Share2,
  BookmarkPlus,
  User
} from 'lucide-react';
import { VideoResult } from '../../services/enhancedSearchService';

interface VideoPreviewProps {
  result: VideoResult;
  searchQuery?: string;
  onPreview?: () => void;
}

export default function VideoPreview({ result, searchQuery, onPreview }: VideoPreviewProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const formatViewCount = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDuration = (duration: string) => {
    return duration; // Already formatted from API
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      const weeks = Math.floor(diffDays / 7);
      return weeks > 0 ? `${weeks} week${weeks > 1 ? 's' : ''} ago` : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 group"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
        <img
          src={result.thumbnail}
          alt={result.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Play Button Overlay */}
        <motion.a
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/20 bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300"
        >
          <div className="bg-red-600 rounded-full p-3 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </motion.a>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {formatDuration(result.duration)}
        </div>

        {/* Time Ago Badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {getTimeAgo(result.publishedAt)}
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
          {highlightText(truncateText(result.description, 150), searchQuery)}
        </p>

        {/* Channel Info */}
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
            {result.channelAvatar ? (
              <img
                src={result.channelAvatar}
                alt={result.channelName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-gray-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {result.channelName}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {formatViewCount(result.viewCount)}
            </div>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(result.publishedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {result.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
            {result.tags.length > 2 && (
              <span className="text-xs text-gray-400">
                +{result.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            Watch Video
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
              title="Share video"
            >
              <Share2 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
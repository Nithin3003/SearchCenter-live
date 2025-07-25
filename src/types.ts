export interface SearchResult {
  id: number | string;
  title: string;
  type: 'repository' | 'code' | 'community'; // Include 'repository' as a type
  source: string;
  url: string;
  snippet: string;
  description?: string; // Add description field
  language?: string;
  stars?: number;
  forks?: number;
  timestamp: string;
  votes?: number;
  tags?: string[];
  answerCount?: number;
  isAnswered?: boolean;
  viewCount?: number;
  lastActivityDate?: string | null;
  // Repository-specific fields
  owner?: {
    login: string;
    avatar_url: string;
    url?: string;
  };
  topics?: string[];
  openIssues?: number;
  watchers?: number;
  license?: string | null;
  path?: string; // For code results
  lineNumbers?: number[]; // For code results
  score?: number; // For sorting
}

export interface SearchFilters {
  language: string;
  timeRange: string;
  sortBy: string;
}

export const defaultSearchFilters: SearchFilters = {
  language: 'all',
  timeRange: 'all',
  sortBy: 'relevance',
};

export interface SearchHistoryItem {
  id?: number;
  user_id: string;
  query: string;
  timestamp: string;
}

export interface FeedbackItem {
  id: string;
  user_id: string | null;
  feedback_type: string;
  content: string; // Keep this field
  rating: number | null;
  email: string;
  resolved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  username: string;
  last_sign_in_at: string;
}

export interface UserPreferences {
  id: string; // Same as user_id for reference
  user_id: string;
  search_history: SearchHistoryItem[];
  clicked_repos: string[]; // Array of repo IDs
  saved_items: string[]; // Array of saved item IDs
  theme_preference: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}

// Add a type for the filter metadata
export interface FilterMetadata {
  languages: Record<string, number>;
  repositories: Record<string, {
    count: number;
    owner: string;
    avatarUrl?: string;
    stars?: number;
  }>;
  timeRanges: Record<string, number>;
}
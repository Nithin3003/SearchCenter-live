import axios from 'axios';

export interface SearchFilters {
  language?: string;
  type?: 'code' | 'videos' | 'datasets' | 'papers' | 'all';
  time?: 'day' | 'week' | 'month' | 'year' | 'all';
  sort?: 'relevance' | 'stars' | 'updated' | 'views' | 'downloads' | 'citations';
  license?: string;
  duration?: 'short' | 'medium' | 'long';
  category?: string;
}

export interface CodeResult {
  id: string;
  title: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  author: string;
  repository: string;
  filePath: string;
  codeSnippet: string;
  lastUpdated: string;
}

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: string;
  viewCount: number;
  channelName: string;
  channelAvatar: string;
  publishedAt: string;
  tags: string[];
}

export interface DatasetResult {
  id: string;
  title: string;
  description: string;
  url: string;
  downloadCount: number;
  fileSize: string;
  license: string;
  author: string;
  organization: string;
  rows: number;
  columns: number;
  coverImage: string;
  tags: string[];
}

export interface PaperResult {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl: string;
  publicationVenue: string;
  year: number;
  citationCount: number;
  doi: string;
  tags: string[];
}

export type SearchResult = CodeResult | VideoResult | DatasetResult | PaperResult;

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

class EnhancedSearchService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCachedResult(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCacheKey(type: string, query: string, filters: SearchFilters) {
    return `${type}:${query}:${JSON.stringify(filters)}`;
  }

  async searchCode(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey('code', query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: query,
        language: filters.language || 'all',
        sort: filters.sort || 'relevance',
      });

      const response = await axios.get(`${this.baseUrl}/search/code?${params}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Code search failed:', error);
      throw new Error('Failed to search code repositories');
    }
  }

  async searchVideos(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey('videos', query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: query,
        duration: filters.duration || 'all',
        sort: filters.sort || 'relevance',
      });

      const response = await axios.get(`${this.baseUrl}/search/videos?${params}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Video search failed:', error);
      throw new Error('Failed to search videos');
    }
  }

  async searchDatasets(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey('datasets', query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: query,
        size: filters.type === 'all' ? 'all' : filters.type,
        license: filters.license || 'all',
        sort: filters.sort || 'relevance',
      });

      const response = await axios.get(`${this.baseUrl}/search/datasets?${params}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Dataset search failed:', error);
      throw new Error('Failed to search datasets');
    }
  }

  async searchPapers(query: string, filters: SearchFilters = {}): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey('papers', query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: query,
        year: filters.time || 'all',
        citations: filters.type === 'all' ? '0' : '10',
        sort: filters.sort || 'relevance',
      });

      const response = await axios.get(`${this.baseUrl}/search/papers?${params}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Paper search failed:', error);
      throw new Error('Failed to search papers');
    }
  }

  async searchAll(query: string, filters: SearchFilters = {}): Promise<{
    code: SearchResponse;
    videos: SearchResponse;
    datasets: SearchResponse;
    papers: SearchResponse;
  }> {
    const cacheKey = this.getCacheKey('all', query, filters);
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const [code, videos, datasets, papers] = await Promise.all([
        this.searchCode(query, filters),
        this.searchVideos(query, filters),
        this.searchDatasets(query, filters),
        this.searchPapers(query, filters),
      ]);

      const result = { code, videos, datasets, papers };
      this.setCachedResult(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Unified search failed:', error);
      throw new Error('Failed to perform unified search');
    }
  }

  async getPopularResources(type: 'all' | 'code' | 'videos' | 'datasets' | 'papers' = 'all'): Promise<SearchResponse> {
    const cacheKey = `popular:${type}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/resources/popular?type=${type}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch popular resources:', error);
      throw new Error('Failed to fetch popular resources');
    }
  }

  async getRecommendations(userId: string): Promise<SearchResponse> {
    const cacheKey = `recommendations:${userId}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${this.baseUrl}/recommendations/${userId}`);
      const data = response.data;

      this.setCachedResult(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const enhancedSearchService = new EnhancedSearchService();
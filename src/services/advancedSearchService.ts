import axios from 'axios';
import { enhancedSearchService, SearchResult } from './enhancedSearchService';

export interface AdvancedSearchQuery {
  query: string;
  engines: ('google' | 'perplexity' | 'edge' | 'local')[];
  searchType: 'web' | 'academic' | 'code' | 'videos' | 'all';
  language?: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'year';
  safeSearch?: boolean;
  includeImages?: boolean;
  includeVideos?: boolean;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'rating';
}

export interface AdvancedSearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  content: string;
  snippet?: string;
  image?: string;
  domain: string;
  publishedDate?: string;
  author?: string;
  type: 'web' | 'academic' | 'code' | 'video';
  source: 'google' | 'perplexity' | 'edge' | 'internal';
  relevanceScore?: number;
  metadata?: {
    rating?: number;
    citations?: number;
    fileSize?: string;
    duration?: string;
    language?: string;
    code?: string;
    tags?: string[];
  };
}

export class AdvancedSearchService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // API Keys
  private readonly GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
  private readonly PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
  private readonly EDGE_API_KEY = import.meta.env.VITE_EDGE_API_KEY || '';

  // Search Engine Configuration
  private readonly searchEngines = {
    google: {
      name: 'Google Search',
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      maxResults: 10,
      timeout: 8000,
    },
    perplexity: {
      name: 'Perplexity',
      baseUrl: 'https://api.perplexity.ai',
      maxResults: 20,
      timeout: 10000,
    },
    edge: {
      name: 'Edge Computing',
      baseUrl: 'https://api.edge.com',
      maxResults: 15,
      timeout: 12000,
    },
  };

  // Caching
  private cache = new Map<string, { results: AdvancedSearchResult[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async searchWithGoogle(query: string, options: AdvancedSearchQuery): Promise<AdvancedSearchResult[]> {
    try {
      const params = new URLSearchParams({
        key: this.GOOGLE_API_KEY,
        cx: '01757666935219739455:389:747:018928278:101:6794:32',
        q: query,
        num: '10',
        safe: options.safeSearch ? 'active' : 'off',
        searchType: options.searchType === 'academic' ? 'scholar' : 'search',
        imgSize: options.includeImages ? 'large' : undefined,
        dateRestrict: this.getTimeFilter(options.timeRange),
        lr: options.language || '',
        sort: this.getSortOrder(options.sortBy),
      });

      const response = await axios.get(`${this.searchEngines.google.baseUrl}?${params}`, {
        timeout: this.searchEngines.google.timeout,
      });

      return response.data.items?.map((item: any) => ({
        id: item.cacheId || item.link,
        title: item.title,
        url: item.link,
        description: item.snippet || item.description || '',
        content: item.pagemap?.content || '',
        snippet: item.snippet,
        image: item.pagemap?.cse_thumbnail,
        domain: this.extractDomain(item.link),
        publishedDate: item.pagemap?.lastReviewed,
        author: item.pagemap?.displayLink,
        type: 'web',
        source: 'google',
        relevanceScore: this.calculateRelevanceScore(item, query),
        metadata: {
          fileSize: undefined,
          duration: undefined,
          language: item.fileFormat,
          tags: this.extractTags(item),
        },
      })) || [];
    } catch (error) {
      console.error('Google search failed:', error);
      return [];
    }
  }

  async searchWithPerplexity(query: string, options: AdvancedSearchQuery): Promise<AdvancedSearchResult[]> {
    try {
      const params = {
        model: 'llama-3.1-70b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful search assistant. Provide comprehensive, accurate results for the given query.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
        stream: false,
      };

      const response = await axios.post(`${this.searchEngines.perplexity.baseUrl}/search`, params, {
        headers: {
          'Authorization': `Bearer ${this.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: this.searchEngines.perplexity.timeout,
      });

      return response.data.choices?.[0]?.message?.content ?
        this.parsePerplexityResponse(response.data.choices[0].message.content, query) : [];
    } catch (error) {
      console.error('Perplexity search failed:', error);
      return [];
    }
  }

  async searchWithEdge(query: string, options: AdvancedSearchQuery): Promise<AdvancedSearchResult[]> {
    try {
      const params = {
        query: query,
        search_type: options.searchType === 'academic' ? 'research' : 'comprehensive',
        language: options.language,
        time_range: options.timeRange,
        safe_search: options.safeSearch,
        include_media: options.includeImages || options.includeVideos,
        max_results: this.searchEngines.edge.maxResults,
      };

      const response = await axios.post(`${this.searchEngines.edge.baseUrl}/search`, params, {
        headers: {
          'Authorization': `Bearer ${this.EDGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: this.searchEngines.edge.timeout,
      });

      return response.data.results?.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description || item.summary || '',
        content: item.content || item.text || '',
        snippet: item.snippet || this.extractSnippet(item),
        image: item.thumbnail || item.image_url,
        domain: this.extractDomain(item.url),
        publishedDate: item.published_at,
        author: item.author || item.source,
        type: this.determineResultType(item),
        source: 'edge',
        relevanceScore: this.calculateRelevanceScore(item, query),
        metadata: this.extractMetadata(item, options),
      })) || [];
    } catch (error) {
      console.error('Edge search failed:', error);
      return [];
    }
  }

  async multiEngineSearch(query: string, options: AdvancedSearchQuery): Promise<{
    google?: AdvancedSearchResult[];
    perplexity?: AdvancedSearchResult[];
    edge?: AdvancedSearchResult[];
    combined?: AdvancedSearchResult[];
  }> {
    const engines = options.engines.includes('all') ?
      ['google', 'perplexity', 'edge'] :
      options.engines.filter(engine => this.searchEngines[engine as keyof typeof this.searchEngines]);

    const searchPromises = engines.map(engine => {
      switch (engine) {
        case 'google':
          return this.searchWithGoogle(query, options);
        case 'perplexity':
          return this.searchWithPerplexity(query, options);
        case 'edge':
          return this.searchWithEdge(query, options);
        default:
          return Promise.resolve([]);
      }
    });

    try {
      const results = await Promise.allSettled(searchPromises);

      // Combine and deduplicate results
      const allResults: AdvancedSearchResult[] = [];
      const seenIds = new Set<string>();

      engines.forEach((engine, index) => {
        const engineResults = results[index];
        if (engineResults) {
          engineResults.forEach((result: any) => {
            if (!seenIds.has(result.id)) {
              seenIds.add(result.id);
              allResults.push(result);
            }
          });
        }
      });

      // Sort combined results by relevance
      const sortedResults = allResults.sort((a, b) =>
        (b.relevanceScore || 0) - (a.relevanceScore || 0)
      );

      return {
        google: results[0] || [],
        perplexity: results[1] || [],
        edge: results[2] || [],
        combined: sortedResults.slice(0, 50),
      };
    } catch (error) {
      console.error('Multi-engine search failed:', error);
      return {
        combined: [],
      };
    }
  }

  // Enhanced local search (combines all results)
  async enhancedSearch(query: string, options: AdvancedSearchQuery): Promise<AdvancedSearchResult[]> {
    const [enhancedResults, externalResults] = await Promise.all([
      enhancedSearchService.searchAll(query, {
        type: options.searchType || 'all',
        sort: options.sortBy || 'relevance',
      }),
      this.multiEngineSearch(query, {
        ...options,
        engines: ['google', 'perplexity', 'edge'],
      }),
    ]);

    // Combine and rank all results
    const combinedResults = [
      ...enhancedResults.map(result => ({
        ...result,
        source: 'internal',
        relevanceScore: this.calculateRelevanceScore(result, query),
      })),
      ...externalResults.combined,
    ];

    // Remove duplicates and sort by relevance
    const deduplicatedResults = this.removeDuplicates(combinedResults);
    const sortedResults = deduplicatedResults.sort((a, b) =>
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    return sortedResults.slice(0, 100);
  }

  // Private helper methods
  private parsePerplexityResponse(content: string, originalQuery: string): AdvancedSearchResult[] {
    try {
      // Try to extract structured data from Perplexity response
      const lines = content.split('\n');
      const results: AdvancedSearchResult[] = [];

      for (const line of lines) {
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
          const text = line.replace(/^[\s•\-\s]/, '').trim();
          if (text) {
            results.push({
              id: `perplexity_${Math.random().toString(36).substr(2, 9)}`,
              title: text.length > 100 ? text.substring(0, 100) + '...' : text,
              url: `https://www.google.com/search?q=${encodeURIComponent(originalQuery)}`,
              description: `AI-powered result for: ${originalQuery}`,
              content: text,
              snippet: this.extractSnippet(text),
              type: 'web',
              source: 'perplexity',
              relevanceScore: 0.8,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to parse Perplexity response:', error);
      return [];
    }
  }

  private extractSnippet(content: string): string {
    // Extract first 150 characters for snippet
    if (content.length <= 150) return content;
    return content.substring(0, 150) + '...';
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || url;
    } catch {
      return url;
    }
  }

  private extractTags(item: any): string[] {
    // Extract tags from different result structures
    if (item.tags) return item.tags;
    if (item.keywords) return item.keywords;
    if (item.categories) return item.categories;
    return [];
  }

  private extractMetadata(item: any, options: AdvancedSearchQuery): any {
    const metadata: any = {};

    // Extract file size
    if (item.size) {
      metadata.fileSize = this.formatFileSize(item.size);
    }

    // Extract duration
    if (item.duration) {
      metadata.duration = this.formatDuration(item.duration);
    }

    // Extract language
    if (item.language) {
      metadata.language = item.language;
    }

    // Extract ratings
    if (item.rating) {
      metadata.rating = item.rating;
    }

    // Extract citations
    if (item.citations) {
      metadata.citations = item.citations;
    }

    // Extract tags
    metadata.tags = this.extractTags(item);

    return metadata;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes < 1099511627776) return (bytes / 1073741824).toFixed(1) + ' GB';
    return (bytes / 1099511627776).toFixed(1) + ' TB';
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  private getTimeFilter(timeRange?: string): string {
    if (!timeRange) return '';
    const now = new Date();

    const timeRanges = {
      hour: new Date(now.getTime() - 60 * 60 * 1000),
      day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };

    return timeRanges[timeRange]?.toISOString().split('T')[0] || '';
  }

  private getSortOrder(sortBy?: string): string {
    const sortOrders = {
      relevance: 'relevance',
      date: 'date',
      popularity: 'popularity',
      rating: 'rating',
    };

    return sortOrders[sortBy as keyof typeof sortOrders] || 'relevance';
  }

  private calculateRelevanceScore(item: any, query: string): number {
    let score = 0.5; // Base score

    // Query matching in title/description
    const queryWords = query.toLowerCase().split(/\s+/);
    const title = (item.title || '').toLowerCase();
    const description = (item.snippet || item.description || '').toLowerCase();

    queryWords.forEach(word => {
      if (title.includes(word)) score += 0.2;
      if (description.includes(word)) score += 0.15;
    });

    // Domain authority (boost for trusted domains)
    const domain = this.extractDomain(item.link || item.url);
    const trustedDomains = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'kaggle.com'];
    if (trustedDomains.some(trusted => domain.includes(trusted))) {
      score += 0.3;
    }

    // Recent content boost
    const publishedDate = new Date(item.publishedDate || item.lastReviewed);
    const daysSincePublish = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublish < 30) score += 0.1;

    // Content length and quality indicators
    const contentLength = (item.content || item.snippet || '').length;
    if (contentLength > 500) score += 0.1;

    return Math.min(score, 1.0);
  }

  private determineResultType(item: any): 'web' | 'academic' | 'code' | 'video' {
    // Determine result type based on available metadata
    if (item.fileFormat) return 'code';
    if (item.duration) return 'video';
    if (item.citations) return 'academic';
    if (item.authors) return 'academic';
    return 'web';
  }

  private removeDuplicates(results: AdvancedSearchResult[]): AdvancedSearchResult[] {
    const seen = new Map<string, boolean>();

    return results.filter(result => {
      const key = `${result.title}_${result.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  }

  // Search suggestion based on recent trends
  async getTrendingQueries(limit = 10): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/trending?limit=${limit}`);
      return response.data.queries || [];
    } catch (error) {
      console.error('Failed to get trending queries:', error);
      return [];
    }
  }

  // Voice search integration (if available)
  async voiceSearch(audioBlob: Blob, language = 'en'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const response = await axios.post(`${this.baseUrl}/search/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.transcript || '';
    } catch (error) {
      console.error('Voice search failed:', error);
      return '';
    }
  }

  // Real-time search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    const cacheKey = `suggestions_${query}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results;
      }
    }

    try {
      const response = await this.multiEngineSearch(query, {
        engines: ['google', 'perplexity'],
        searchType: 'web',
        maxResults: 5,
      });

      const suggestions = response.combined?.slice(0, 5).map(result => result.title);

      this.cache.set(cacheKey, {
        results: suggestions,
        timestamp: Date.now(),
      });

      return suggestions;
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  // Advanced search with filters
  async filteredSearch(query: string, filters: {
    minRelevanceScore?: number;
    excludeDomains?: string[];
    includeOnly?: string[];
  }): Promise<AdvancedSearchResult[]> {
    const results = await this.enhancedSearch(query, {
      searchType: filters.type || 'all',
      sortBy: filters.sortBy || 'relevance',
    });

    let filteredResults = results.filter(result => {
      if (minRelevanceScore && (result.relevanceScore || 0) < minRelevanceScore) {
        return false;
      }

      if (excludeDomains?.length) {
        const domain = this.extractDomain(result.url);
        if (excludeDomains.some(excluded => domain.includes(excluded))) {
          return false;
        }
      }

      if (includeOnly?.length && includeOnly.some(only => result.url.includes(only))) {
        return false;
      }
    });

    return filteredResults;
  }

  // Search analytics
  async logSearchQuery(query: string, userId?: string, resultsFound: number, engine: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/search/analytics`, {
        query,
        userId,
        resultsFound,
        engine,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log search analytics:', error);
    }
  }
}

export const advancedSearchService = new AdvancedSearchService();
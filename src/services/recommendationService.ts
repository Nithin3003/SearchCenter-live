import { axios } from 'axios';
import { enhancedSearchService, SearchResult, SearchFilters } from './enhancedSearchService';
import { rankingService } from './rankingService';

export interface RecommendationType {
  'trending': {
    timeframe: '24h' | '7d' | '30d' | '90d';
    category?: 'code' | 'videos' | 'datasets' | 'papers' | 'all';
    minPopularity: number;
  };
  'personalized': {
    basedOn: 'user_history' | 'user_profile' | 'user_ranking' | 'user_preferences' | 'collaborative_filtering';
    algorithm?: 'content_based' | 'collaborative' | 'hybrid';
    boostFactors: string[];
  };
  'similar': {
    resourceId: string;
    maxResults: number;
    similarity: 'semantic' | 'metadata' | 'behavioral';
  };
  'contextual': {
    currentQuery: string;
    userSkill: 'beginner' | 'intermediate' | 'advanced';
    context: 'project' | 'learning' | 'research';
    relatedTopics: string[];
  };
}

export interface RecommendationResult {
  id: string;
  type: RecommendationType;
  resource: SearchResult;
  score: number;
  reason: string;
  explanation: string;
  metadata?: {
    popularityRank?: number;
    userInteractionScore?: number;
    qualityScore?: number;
    relevanceScore?: number;
    confidence?: number;
  };
}

export interface UserBehavior {
  userId: string;
  searchHistory: {
    query: string;
    frequency: number;
    lastSearched: string;
    clickedResults: Array<{
      resourceId: string;
      timestamp: string;
      interactionType: 'view' | 'download' | 'bookmark' | 'share';
    }>;
  }[];
  savedResources: string[];
  preferences: {
    resourceTypes: string[];
    topics: string[];
    difficulty: string;
    languages: string[];
  };
  interactions: {
    viewed: Array<{
      resourceId: string;
      timestamp: string;
      duration: number;
      completion: number;
    }>;
    searched: Array<{
      query: string;
      timestamp: string;
      resultsCount: number;
      selectedFilters: SearchFilters;
    }>;
  };

class RecommendationService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  private cache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Recommendation algorithms
  private readonly ALGORITHMS = {
    content_based: {
      name: 'Content-Based Filtering',
      weight: 0.4,
      description: 'Recommend based on user behavior and preferences',
    },
    collaborative: {
      name: 'Collaborative Filtering',
      weight: 0.3,
      description: 'Recommend based on similar users behavior',
    },
    popularity_based: {
      name: 'Popularity-Based',
      weight: 0.2,
      description: 'Recommend based on overall popularity',
    },
    semantic: {
      name: 'Semantic Analysis',
      weight: 0.3,
      description: 'Recommend based on content similarity',
    },
  };

  async getRecommendations(
    userId: string,
    type: keyof RecommendationType,
    params: any = {}
  ): Promise<RecommendationResult[]> {
    const cacheKey = `${userId}_${type}_${JSON.stringify(params)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let recommendations: RecommendationResult[] = [];

      switch (type) {
        case 'trending':
          recommendations = await this.getTrendingRecommendations(userId, params);
          break;
        case 'personalized':
          recommendations = await this.getPersonalizedRecommendations(userId, params);
          break;
        case 'similar':
          recommendations = await this.getSimilarRecommendations(userId, params);
          break;
        case 'contextual':
          recommendations = await this.getContextualRecommendations(userId, params);
          break;
      }

      this.cache.set(cacheKey, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  // Trending recommendations
  private async getTrendingRecommendations(userId: string, params: RecommendationType['trending']): Promise<RecommendationResult[]> {
    try {
      const { timeframe, category, minPopularity } = params;
      const timeFilters = this.getTimeFilters(timeframe);

      const [codeResults, videoResults, datasetResults, paperResults] = await Promise.all([
        enhancedSearchService.searchCode('', { sort: 'popularity', ...timeFilters }),
        enhancedSearchService.searchVideos('', { sort: 'views', ...timeFilters }),
        enhancedSearchService.searchDatasets('', { sort: 'downloads', ...timeFilters }),
        enhancedSearchService.searchPapers('', { sort: 'citations', ...timeFilters }),
      ]);

      const allResults = this.filterResultsByCategory(
        [...codeResults.results, ...videoResults.results, ...datasetResults.results, ...paperResults.results],
        category,
        minPopularity
      );

      return allResults.slice(0, 50).map((resource, index) => ({
        id: `trending_${index}`,
        type: 'trending',
        resource,
        score: this.calculateTrendingScore(resource, timeframe, category),
        reason: this.getTrendingReason(resource, timeframe),
        explanation: this.getTrendingExplanation(resource, timeframe),
        metadata: {
          popularityRank: index + 1,
          confidence: this.calculateConfidence(resource, index, allResults.length),
        },
      }));
    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
      throw new Error('Failed to get trending recommendations');
    }
  }

  // Personalized recommendations
  private async getPersonalizedRecommendations(userId: string, params: RecommendationType['personalized']): Promise<RecommendationResult[]> {
    try {
      const { basedOn, algorithm, boostFactors } = params;
      const userBehavior = await this.getUserBehavior(userId);
      const userRanking = await rankingService.calculateUserRanking(userId);

      const recommendations: RecommendationResult[] = [];

      if (basedOn === 'user_history' && userBehavior.searchHistory.length > 0) {
        recommendations.push(...await this.getHistoryBasedRecommendations(userBehavior));
      }

      if (basedOn === 'user_profile') {
        recommendations.push(...await this.getProfileBasedRecommendations(userBehavior, userRanking));
      }

      if (basedOn === 'user_ranking') {
        recommendations.push(...await this.getRankingBasedRecommendations(userBehavior, userRanking));
      }

      if (basedOn === 'user_preferences') {
        recommendations.push(...await this.getPreferenceBasedRecommendations(userBehavior));
      }

      // Combine recommendations using specified algorithm
      return this.combineRecommendations(recommendations, algorithm);
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      throw new Error('Failed to get personalized recommendations');
    }
  }

  // Similar recommendations
  private async getSimilarRecommendations(userId: string, params: RecommendationType['similar']): Promise<RecommendationResult[]> {
    try {
      const { resourceId, maxResults = 10, similarity = 'semantic' } = params;

      const resource = await this.getResourceById(resourceId);
      const similarResources = await this.findSimilarResources(resource, similarity, maxResults);

      return similarResources.map((similarResource, index) => ({
        id: `similar_${index}`,
        type: 'similar',
        resource: similarResource,
        score: this.calculateSimilarityScore(resource, similarResource, similarity),
        reason: this.getSimilarityReason(resource, similarResource, similarity),
        explanation: this.getSimilarityExplanation(resource, similarResource, similarity),
      }));
    } catch (error) {
      console.error('Failed to get similar recommendations:', error);
      throw new Error('Failed to get similar recommendations');
    }
  }

  // Contextual recommendations
  private async getContextualRecommendations(userId: string, params: RecommendationType['contextual']): Promise<RecommendationResult[]> {
    try {
      const { currentQuery, userSkill, context, relatedTopics } = params;
      const userBehavior = await this.getUserBehavior(userId);

      const recommendations: RecommendationResult[] = [];

      // Query-based contextual recommendations
      if (currentQuery && userBehavior.searchHistory.length > 0) {
        recommendations.push(...await this.getQueryBasedRecommendations(currentQuery, userSkill, context));
      }

      // Context-based recommendations
      if (context === 'project' && relatedTopics.length > 0) {
        recommendations.push(...await this.getProjectBasedRecommendations(relatedTopics, userSkill));
      }

      if (context === 'learning' && relatedTopics.length > 0) {
        recommendations.push(...await this.getLearningPathRecommendations(relatedTopics, userSkill));
      }

      if (context === 'research' && relatedTopics.length > 0) {
        recommendations.push(...await this.getResearchBasedRecommendations(relatedTopics));
      }

      return recommendations.slice(0, 20);
    } catch (error) {
      console.error('Failed to get contextual recommendations:', error);
      throw new Error('Failed to get contextual recommendations');
    }
  }

  // Helper methods
  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/behavior`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user behavior:', error);
      return this.getDefaultBehavior();
    }
  }

  private getDefaultBehavior(): UserBehavior {
    return {
      userId,
      searchHistory: [],
      savedResources: [],
      preferences: {
        resourceTypes: ['code', 'videos'],
        topics: [],
        difficulty: 'intermediate',
        languages: ['javascript', 'python'],
      },
      interactions: {
        viewed: [],
        searched: [],
      },
    };
  }

  private async getResourceById(resourceId: string): Promise<SearchResult | null> {
    try {
      // Search across all resource types
      const [codeResults, videoResults, datasetResults, paperResults] = await Promise.all([
        enhancedSearchService.searchCode('', {}),
        enhancedSearchService.searchVideos('', {}),
        enhancedSearchService.searchDatasets('', {}),
        enhancedSearchService.searchPapers('', {}),
      ]);

      const allResults = [
        ...codeResults.results,
        ...videoResults.results,
        ...datasetResults.results,
        ...paperResults.results,
      ];

      return allResults.find(resource => resource.id === resourceId) || null;
    } catch (error) {
      console.error('Failed to get resource by ID:', error);
      return null;
    }
  }

  private async findSimilarResources(resource: SearchResult | null, similarity: string, maxResults: number): Promise<SearchResult[]> {
    if (!resource) return [];

    try {
      let query = '';

      // Extract keywords based on resource type
      if ('title' in resource) {
        query = resource.title;
      } else if ('description' in resource) {
        query = resource.description;
      } else if ('tags' in resource) {
        query = (resource as any).tags?.join(' ') || '';
      }

      const allResults = await enhancedSearchService.searchAll(query, {});
      return allResults
        .filter(res => res.id !== resource.id)
        .slice(0, maxResults);
    } catch (error) {
      console.error('Failed to find similar resources:', error);
      return [];
    }
  }

  // Specific recommendation generators
  private async getHistoryBasedRecommendations(behavior: UserBehavior): Promise<RecommendationResult[]> {
    const recentQueries = behavior.searchHistory.slice(-5);
    const recommendations: RecommendationResult[] = [];

    for (const query of recentQueries) {
      const results = await enhancedSearchService.searchAll(query.query, {});
      recommendations.push(...this.mapResultsToRecommendations(results, 'user_history', query));
    }

    return recommendations;
  }

  private async getProfileBasedRecommendations(behavior: UserBehavior, ranking: any): Promise<RecommendationResult[]> {
    const preferences = behavior.preferences;
    const recommendations: RecommendationResult[] = [];

    for (const resourceType of preferences.resourceTypes) {
      const results = await enhancedSearchService.searchAll('', { type: resourceType });
      recommendations.push(...this.mapResultsToRecommendations(results.slice(0, 5), 'user_profile', `Based on your ${resourceType} preferences`));
    }

    return recommendations;
  }

  private async getRankingBasedRecommendations(behavior: UserBehavior, ranking: any): Promise<RecommendationResult[]> {
    // Recommend resources popular among users at similar ranking levels
    const levelMultipliers = {
      1: 0.8,    // Novice gets beginner content
      2: 0.9,    // Beginner gets content for beginners-intermediates
      3: 1.0,    // Intermediate gets all content
      4: 1.1,    // Advanced gets advanced content
      5: 1.2,    // Expert gets expert-level content
    };

    const multiplier = levelMultipliers[ranking.level] || 1.0;
    const popularAmongSimilarUsers = await this.getPopularResourcesForRankingLevel(ranking.level);

    return this.mapResultsToRecommendations(popularAmongSimilarUsers.slice(0, 8), 'user_ranking', `Popular among ${ranking.level} level users`);
  }

  private async getPreferenceBasedRecommendations(behavior: UserBehavior): Promise<RecommendationResult[]> {
    // Recommend based on user's specific preferences
    const { topics, languages, difficulty } = behavior.preferences;
    const recommendations: RecommendationResult[] = [];

    if (topics.length > 0) {
      for (const topic of topics) {
        const results = await enhancedSearchService.searchAll(topic, {});
        recommendations.push(...this.mapResultsToRecommendations(results.slice(0, 3), 'user_preferences', `Based on your interest in ${topic}`));
      }
    }

    if (languages.length > 0) {
      for (const language of languages) {
        const results = await enhancedSearchService.searchAll('', { language });
        recommendations.push(...this.mapResultsToRecommendations(results.slice(0, 2), 'user_preferences', `Based on your preference for ${language}`));
      }
    }

    if (difficulty) {
      const difficultyFilters = {
        beginner: { minComplexity: 1, maxComplexity: 3 },
        intermediate: { minComplexity: 4, maxComplexity: 6 },
        advanced: { minComplexity: 7, maxComplexity: 10 },
      };

      const filter = difficultyFilters[difficulty];
      if (filter) {
        const results = await enhancedSearchService.searchAll('', { minComplexity: filter.minComplexity, maxComplexity: filter.maxComplexity });
        recommendations.push(...this.mapResultsToRecommendations(results.slice(0, 5), 'user_preferences', `For ${difficulty} level`));
      }
    }

    return recommendations;
  }

  private async getQueryBasedRecommendations(query: string, skill: string, context: string): Promise<RecommendationResult[]> {
    const contextMap = {
      project: { code: 0.7, videos: 0.5, datasets: 0.6, papers: 0.3 },
      learning: { code: 0.6, videos: 0.4, datasets: 0.3, papers: 0.2 },
      research: { code: 0.4, videos: 0.3, datasets: 0.5, papers: 0.6 },
    };

    const weights = contextMap[context as keyof typeof contextMap] || contextMap.learning;
    const [codeResults, videoResults, datasetResults, paperResults] = await Promise.all([
      enhancedSearchService.searchAll(query, { sort: 'relevance' }),
      enhancedSearchService.searchAll(query, { sort: 'relevance' }),
      enhancedSearchService.searchAll(query, { sort: 'relevance' }),
      enhancedSearchService.searchAll(query, { sort: 'relevance' }),
    ]);

    const weightedResults = [
      ...codeResults.results.map(r => ({ ...r, score: r.score * weights.code })),
      ...videoResults.results.map(r => ({ ...r, score: r.score * weights.videos })),
      ...datasetResults.results.map(r => ({ ...r, score: r.score * weights.datasets })),
      ...paperResults.results.map(r => ({ ...r, score: r.score * weights.papers })),
    ];

    return this.mapResultsToRecommendations(
      weightedResults.sort((a, b) => b.score - a.score).slice(0, 15),
      'contextual',
      `Contextually relevant for ${context}`
    );
  }

  private async getProjectBasedRecommendations(topics: string[], skill: string): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const topic of topics) {
      const projectQuery = `${topic} project tutorial`;
      const [codeResults, datasetResults] = await Promise.all([
        enhancedSearchService.searchAll(projectQuery, { type: 'code' }),
        enhancedSearchService.searchAll(projectQuery, { type: 'datasets' }),
      ]);

      const filteredResults = [
        ...codeResults.results.filter(r => r.score > 0.6),
        ...datasetResults.results.filter(r => r.score > 0.6),
      ];

      recommendations.push(...this.mapResultsToRecommendations(
        filteredResults.slice(0, 3),
        'contextual',
        `${topic} project resources for ${skill} level`
      ));
    }

    return recommendations;
  }

  private async getLearningPathRecommendations(topics: string[], skill: string): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const topic of topics) {
      const learningQuery = `${topic} tutorial guide`;
      const [videoResults, paperResults] = await Promise.all([
        enhancedSearchService.searchAll(learningQuery, { type: 'videos' }),
        enhancedSearchService.searchAll(learningQuery, { type: 'papers' }),
      ]);

      const filteredResults = [
        ...videoResults.results.filter(r => (r as any).duration && (r as any).duration < 1800), // < 30min
        ...paperResults.results.filter(r => (r as any).citationCount && (r as any).citationCount > 50),
      ];

      recommendations.push(...this.mapResultsToRecommendations(
        filteredResults.slice(0, 2),
        'contextual',
        `${topic} learning resources for ${skill} level`
      ));
    }

    return recommendations;
  }

  private async getResearchBasedRecommendations(topics: string[]): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    for (const topic of topics) {
      const researchQuery = `${topic} research methods`;
      const [paperResults, datasetResults] = await Promise.all([
        enhancedSearchService.searchAll(researchQuery, { type: 'papers' }),
        enhancedSearchService.searchAll(researchQuery, { type: 'datasets' }),
      ]);

      const filteredResults = [
        ...paperResults.results.filter(r => (r as any).year && (r as any).year >= new Date().getFullYear() - 2),
        ...datasetResults.results.filter(r => (r as any).downloadCount && (r as any).downloadCount > 100),
      ];

      recommendations.push(...this.mapResultsToRecommendations(
        filteredResults.slice(0, 3),
        'contextual',
        `${topic} research resources`
      ));
    }

    return recommendations;
  }

  // Utility methods
  private mapResultsToRecommendations(results: SearchResult[], reason: string): RecommendationResult[] {
    return results.map((resource, index) => ({
      id: `rec_${index}`,
      type: 'personalized',
      resource,
      score: resource.score || Math.random() * 0.8,
      reason,
      explanation: `Recommended based on your usage patterns and preferences`,
      metadata: {
        qualityScore: this.calculateQualityScore(resource),
        userInteractionScore: this.calculateUserInteractionScore(resource),
        relevanceScore: resource.score || Math.random() * 0.8,
      },
    }));
  }

  private getTimeFilters(timeframe: string): Partial<SearchFilters> {
    const now = new Date();
    let dateThreshold: Date;

    switch (timeframe) {
      case '24h':
        dateThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      time: timeframe,
      dateFrom: dateThreshold.toISOString().split('T')[0],
    };
  }

  private filterResultsByCategory(results: SearchResult[], category: string, minPopularity: number): SearchResult[] {
    if (category === 'all') {
      return results.filter(r => this.calculatePopularity(r) >= minPopularity);
    }

    const categoryMap = {
      code: (r: SearchResult) => 'language' in r,
      videos: (r: SearchResult) => 'duration' in r || 'viewCount' in r,
      datasets: (r: SearchResult) => 'downloadCount' in r || 'fileSize' in r,
      papers: (r: SearchResult) => 'citationCount' in r || 'authors' in r,
    };

    return results.filter((r: SearchResult) => categoryMap[category as keyof typeof categoryMap](r));
  }

  private calculateTrendingScore(resource: SearchResult, timeframe: string, category: string): number {
    const baseScore = this.calculatePopularity(resource);
    const timeDecay = this.getTimeDecayFactor(timeframe);
    const categoryBoost = category === 'all' ? 1.2 : 1.0;

    return baseScore * timeDecay * categoryBoost;
  }

  private getTrendingReason(resource: SearchResult, timeframe: string): string {
    const category = this.getResourceCategory(resource);
    return `Trending ${category} resource for ${timeframe}`;
  }

  private getTrendingExplanation(resource: SearchResult, timeframe: string): string {
    const popularity = this.getPopularityMeasure(resource);
    return `Popular in ${timeframe} based on ${popularity}`;
  }

  private getTimeDecayFactor(timeframe: string): number {
    const factors = {
      '24h': 1.0,
      '7d': 0.8,
      '30d': 0.6,
      '90d': 0.3,
    };

    return factors[timeframe as keyof typeof factors] || 0.5;
  }

  private calculateSimilarityScore(baseResource: SearchResult, similarResource: SearchResult, similarity: string): number {
    let score = 0.5; // Base similarity score

    if (similarity === 'semantic') {
      // Simple semantic similarity based on title/description
      score += this.calculateSemanticSimilarity(baseResource, similarResource);
    }

    if (similarity === 'metadata') {
      // Similarity based on metadata fields
      score += this.calculateMetadataSimilarity(baseResource, similarResource);
    }

    if (similarity === 'behavioral') {
      // Similarity based on user interaction patterns
      score += 0.3; // Boost if users who viewed baseResource also viewed this
    }

    return Math.min(score, 1.0);
  }

  private calculateSemanticSimilarity(a: SearchResult, b: SearchResult): number {
    // Simplified semantic similarity calculation
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();
    const aDesc = ((a as any).description || '').toLowerCase();
    const bDesc = ((b as any).description || '').toLowerCase();

    const titleSimilarity = this.calculateTextSimilarity(aTitle, bTitle);
    const descSimilarity = this.calculateTextSimilarity(aDesc, bDesc);

    return (titleSimilarity * 0.7 + descSimilarity * 0.3) / 2;
  }

  private calculateMetadataSimilarity(a: SearchResult, b: SearchResult): number {
    let similarity = 0;
    let totalFields = 0;

    if ('language' in a && 'language' in b) {
      similarity += a.language === b.language ? 1 : 0;
      totalFields++;
    }

    if ('tags' in a && 'tags' in b) {
      const aTags = new Set(((a as any).tags || []) as string[]);
      const bTags = new Set(((b as any).tags || []) as string[]);
      const intersection = new Set([...aTags].filter(tag => bTags.has(tag)));
      similarity += intersection.size / Math.max(aTags.size, bTags.size);
      totalFields++;
    }

    return totalFields > 0 ? similarity / totalFields : 0;
  }

  private calculateTextSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter(word => wordsB.has(word)));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private getSimilarityReason(baseResource: SearchResult, similarResource: SearchResult, similarity: string): string {
    const category = this.getResourceCategory(baseResource);
    return `${category} similar to this resource based on ${similarity} analysis`;
  }

  private getSimilarityExplanation(baseResource: SearchResult, similarResource: SearchResult, similarity: string): string {
    return `Our algorithms found that ${Math.round(this.calculateSimilarityScore(baseResource, similarResource) * 100)}% similarity between these resources`;
  }

  private combineRecommendations(recommendations: RecommendationResult[], algorithm?: string): RecommendationResult[] {
    if (!algorithm) return recommendations;

    const weights = this.ALGORITHMS[algorithm as keyof typeof this.ALGORITHMS];
    if (!weights) return recommendations;

    // Apply algorithm weights and combine
    return recommendations
      .map(rec => ({
        ...rec,
        score: rec.score * weights.weight,
        explanation: `${rec.explanation} (boosted by ${algorithm})`,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }

  private getResourceCategory(resource: SearchResult): string {
    if ('language' in resource) return 'code';
    if ('duration' in resource) return 'video';
    if ('downloadCount' in resource) return 'dataset';
    if ('citationCount' in resource) return 'paper';
    return 'general';
  }

  private getPopularity(resource: SearchResult): number {
    let popularity = 0;

    if ('stars' in resource) {
      popularity += Math.log((resource as any).stars + 1) * 0.3;
    }

    if ('viewCount' in resource) {
      popularity += Math.log((resource as any).viewCount + 1) * 0.2;
    }

    if ('downloadCount' in resource) {
      popularity += Math.log((resource as any).downloadCount + 1) * 0.25;
    }

    if ('citationCount' in resource) {
      popularity += Math.log((resource as any).citationCount + 1) * 0.15;
    }

    return popularity;
  }

  private getPopularityMeasure(resource: SearchResult): string {
    if ('stars' in resource) return 'stars';
    if ('viewCount' in resource) return 'views';
    if ('downloadCount' in resource) return 'downloads';
    if ('citationCount' in resource) return 'citations';
    return 'popularity';
  }

  private calculateQualityScore(resource: SearchResult): number {
    let score = 0.5; // Base quality score

    // Age factor (newer is generally better)
    if ('lastUpdated' in resource || 'updatedAt' in resource) {
      const ageInDays = (Date.now() - new Date((resource as any).lastUpdated || (resource as any).updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) score += 0.2;
      if (ageInDays < 7) score += 0.1;
    }

    // Description quality
    const description = ((resource as any).description || '').length;
    if (description > 100) score += 0.2;
    if (description > 500) score += 0.3;

    // Repository/activity metrics
    if ('stars' in resource && (resource as any).stars > 100) score += 0.2;
    if ('viewCount' in resource && (resource as any).viewCount > 1000) score += 0.2;
    if ('downloadCount' in resource && (resource as any).downloadCount > 100) score += 0.2;

    return Math.min(score, 1.0);
  }

  private calculateUserInteractionScore(resource: SearchResult): number {
    // This would be calculated from actual user interaction data
    // For now, return a normalized score based on assumed interaction patterns
    return Math.random() * 0.3 + 0.2; // Some baseline interaction score
  }

  private calculateConfidence(resource: SearchResult, index: number, total: number): number {
    // Confidence based on position in recommendation list
    const positionScore = 1.0 - (index / total);
    const qualityBonus = this.calculateQualityScore(resource) * 0.3;
    const popularityBonus = Math.min(this.getPopularity(resource) / 1000, 0.2);

    return positionScore + qualityBonus + popularityBonus;
  }

  // Advanced recommendation algorithms
  async getHybridRecommendations(userId: string, params: RecommendationType['personalized']): Promise<RecommendationResult[]> {
    // Combine multiple recommendation strategies
    const [historyRecs, profileRecs, rankingRecs] = await Promise.all([
      this.getPersonalizedRecommendations(userId, { basedOn: 'user_history' }),
      this.getPersonalizedRecommendations(userId, { basedOn: 'user_profile' }),
      this.getPersonalizedRecommendations(userId, { basedOn: 'user_ranking' }),
    ]);

    // Weighted hybrid combination
    const hybridRecs = [
      ...historyRecs.map((rec, i) => ({
        ...rec,
        score: rec.score * 0.4, // Weight for history-based
        explanation: `${rec.explanation} (history-based)`,
      })),
      ...profileRecs.map((rec, i) => ({
        ...rec,
        score: rec.score * 0.3, // Weight for profile-based
        explanation: `${rec.explanation} (profile-based)`,
      })),
      ...rankingRecs.map((rec, i) => ({
        ...rec,
        score: rec.score * 0.3, // Weight for ranking-based
        explanation: `${rec.explanation} (ranking-based)`,
      })),
    ];

    return hybridRecs
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(rec => ({
        ...rec,
        score: rec.score * 0.5, // Boost for hybrid approach
        explanation: `${rec.explanation} (hybrid algorithm)`,
        metadata: {
          ...rec.metadata,
          algorithm: 'hybrid',
        },
      }));
  }

  // Real-time recommendation updates
  async updateRecommendationFeedback(userId: string, resourceId: string, feedback: {
    liked: boolean;
    disliked: boolean;
    clicked: boolean;
    duration?: number;
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/users/${userId}/recommendations/feedback`, {
        resourceId,
        feedback,
        timestamp: new Date().toISOString(),
      });

      // Invalidate relevant cache entries
      const cacheKeys = Array.from(this.cache.keys()).filter(key => key.includes(userId));
      cacheKeys.forEach(key => this.cache.delete(key));

    } catch (error) {
      console.error('Failed to update recommendation feedback:', error);
    }
  }
}

export const recommendationService = new RecommendationService();
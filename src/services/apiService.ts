import axios from 'axios';

// GitHub API Service
class GitHubAPIService {
  private baseUrl = 'https://api.github.com';
  private token = import.meta.env.VITE_GITHUB_TOKEN;

  private headers = {
    'Authorization': `token ${this.token}`,
    'Accept': 'application/vnd.github.v3+json',
  };

  async searchRepositories(query: string, language?: string, sort = 'stars', order = 'desc') {
    try {
      const params = new URLSearchParams({
        q: `${query}${language ? ` language:${language}` : ''}`,
        sort,
        order,
        per_page: '20',
      });

      const response = await axios.get(`${this.baseUrl}/search/repositories?${params}`, {
        headers: this.token ? this.headers : {},
      });

      return response.data.items.map((repo: any) => ({
        id: repo.id,
        title: repo.name,
        description: repo.description || '',
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        author: repo.owner.login,
        repository: repo.full_name,
        lastUpdated: repo.updated_at,
      }));
    } catch (error) {
      console.error('GitHub repository search failed:', error);
      throw new Error('Failed to search GitHub repositories');
    }
  }

  async searchCode(query: string, language?: string, sort = 'updated') {
    try {
      const params = new URLSearchParams({
        q: `${query}${language ? ` language:${language}` : ''}`,
        sort,
        order: 'desc',
        per_page: '20',
      });

      const response = await axios.get(`${this.baseUrl}/search/code?${params}`, {
        headers: this.token ? this.headers : {},
      });

      return response.data.items.map((item: any) => ({
        id: item.sha,
        title: item.name,
        description: '', // Code search doesn't provide descriptions
        url: item.html_url,
        language: language || this.detectLanguage(item.name),
        stars: 0, // Individual files don't have stars
        forks: 0,
        author: item.repository.owner.login,
        repository: item.repository.full_name,
        filePath: item.path,
        codeSnippet: '', // Would need separate API call to get content
        lastUpdated: '', // Not available in code search
      }));
    } catch (error) {
      console.error('GitHub code search failed:', error);
      throw new Error('Failed to search GitHub code');
    }
  }

  async getFileContent(owner: string, repo: string, path: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.token ? this.headers : {},
      });

      // GitHub returns base64 encoded content
      const content = atob(response.data.content);
      return content;
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      throw new Error('Failed to fetch file content');
    }
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sql': 'SQL',
    };

    return langMap[ext || ''] || 'Unknown';
  }
}

// YouTube API Service
class YouTubeAPIService {
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  async searchVideos(query: string, maxResults = 20) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        order: 'relevance',
        key: this.apiKey,
      });

      const response = await axios.get(`${this.baseUrl}/search?${params}`);
      const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed video information
      const detailsParams = new URLSearchParams({
        part: 'statistics,contentDetails',
        id: videoIds,
        key: this.apiKey,
      });

      const detailsResponse = await axios.get(`${this.baseUrl}/videos?${detailsParams}`);
      const detailsMap = new Map(
        detailsResponse.data.items.map((item: any) => [item.id, item])
      );

      return response.data.items.map((item: any) => {
        const details = detailsMap.get(item.id);
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnail: item.snippet.thumbnails.high.url,
          duration: this.formatDuration(details?.contentDetails?.duration || ''),
          viewCount: parseInt(details?.statistics?.viewCount || '0'),
          channelName: item.snippet.channelTitle,
          channelAvatar: '', // Would need separate API call
          publishedAt: item.snippet.publishedAt,
          tags: item.snippet.tags || [],
        };
      });
    } catch (error) {
      console.error('YouTube search failed:', error);
      throw new Error('Failed to search YouTube videos');
    }
  }

  private formatDuration(duration: string): string {
    // Convert ISO 8601 duration (PT4M13S) to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '';

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Kaggle API Service
class KaggleAPIService {
  private baseUrl = 'https://www.kaggle.com/api/v1';
  private apiKey = import.meta.env.VITE_KAGGLE_API_KEY;

  async searchDatasets(query: string, maxResults = 20) {
    try {
      const params = new URLSearchParams({
        search: query,
        size: maxResults.toString(),
      });

      const response = await axios.get(`${this.baseUrl}/datasets/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data.map((dataset: any) => ({
        id: dataset.ref,
        title: dataset.title,
        description: dataset.subtitle || '',
        url: `https://www.kaggle.com/datasets/${dataset.ref}`,
        downloadCount: dataset.totalDownloads || 0,
        fileSize: this.formatFileSize(dataset.totalSize || 0),
        license: dataset.license || 'Unknown',
        author: dataset.author?.name || 'Unknown',
        organization: dataset.author?.organizationName || '',
        rows: 0, // Not available in list endpoint
        columns: 0, // Not available in list endpoint
        coverImage: dataset.imageUrl || '',
        tags: dataset.tags || [],
      }));
    } catch (error) {
      console.error('Kaggle search failed:', error);
      throw new Error('Failed to search Kaggle datasets');
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Semantic Scholar API Service
class SemanticScholarAPIService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  async searchPapers(query: string, maxResults = 20) {
    try {
      const params = new URLSearchParams({
        query,
        limit: maxResults.toString(),
        fields: 'title,authors,abstract,venue,year,citationCount,doi,url,isOpenAccess',
      });

      const response = await axios.get(`${this.baseUrl}/paper/search?${params}`);

      return response.data.data.map((paper: any) => ({
        id: paper.paperId,
        title: paper.title,
        authors: paper.authors?.map((author: any) => author.name) || [],
        abstract: paper.abstract || '',
        url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        pdfUrl: paper.isOpenAccess ? `https://www.semanticscholar.org/paper/${paper.paperId}` : '',
        publicationVenue: paper.venue || '',
        year: paper.year || new Date().getFullYear(),
        citationCount: paper.citationCount || 0,
        doi: paper.doi || '',
        tags: [], // Not provided by Semantic Scholar API
      }));
    } catch (error) {
      console.error('Semantic Scholar search failed:', error);
      throw new Error('Failed to search research papers');
    }
  }
}

// Export API services
export const githubAPI = new GitHubAPIService();
export const youtubeAPI = new YouTubeAPIService();
export const kaggleAPI = new KaggleAPIService();
export const semanticScholarAPI = new SemanticScholarAPIService();

// Unified API service
export class APIService {
  async searchAllSources(query: string, filters: any = {}) {
    const results = await Promise.allSettled([
      githubAPI.searchRepositories(query, filters.language),
      youtubeAPI.searchVideos(query),
      kaggleAPI.searchDatasets(query),
      semanticScholarAPI.searchPapers(query),
    ]);

    return {
      code: results[0].status === 'fulfilled' ? results[0].value : [],
      videos: results[1].status === 'fulfilled' ? results[1].value : [],
      datasets: results[2].status === 'fulfilled' ? results[2].value : [],
      papers: results[3].status === 'fulfilled' ? results[3].value : [],
    };
  }

  async getPopularContent() {
    const [popularRepos, popularVideos, popularDatasets, popularPapers] = await Promise.allSettled([
      githubAPI.searchRepositories('stars:>1000', undefined, 'stars'),
      youtubeAPI.searchVideos('tutorial'),
      kaggleAPI.searchDatasets('', 10),
      semanticScholarAPI.searchPapers('machine learning', 10),
    ]);

    return {
      code: popularRepos.status === 'fulfilled' ? popularRepos.value.slice(0, 5) : [],
      videos: popularVideos.status === 'fulfilled' ? popularVideos.value.slice(0, 5) : [],
      datasets: popularDatasets.status === 'fulfilled' ? popularDatasets.value.slice(0, 5) : [],
      papers: popularPapers.status === 'fulfilled' ? popularPapers.value.slice(0, 5) : [],
    };
  }
}

export const apiService = new APIService();
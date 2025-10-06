const axios = require('axios');
const serpApiConfig = require('../config/serpapi');

class SerpApiService {
  constructor() {
    this.baseUrl = serpApiConfig.baseUrl;
    this.apiKey = serpApiConfig.apiKey;
  }

  /**
   * Search Google Scholar with a query
   * @param {string} query - Search query
   * @param {number} start - Pagination offset (0, 10, 20, etc.)
   * @param {object} options - Additional search options
   * @returns {Promise<object>} - Search results
   */
  async search(query, start = 0, options = {}) {
    try {
      const params = {
        engine: 'google_scholar',
        api_key: this.apiKey,
        q: query,
        start: start,
        num: options.num || 10,
        ...options
      };

      console.log(`🔍 Searching Google Scholar: "${query}" (offset: ${start})`);
      
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 30000 // 30 second timeout
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`SerpAPI Error: ${error.response.data.error || error.message}`);
      }
      throw new Error(`Network Error: ${error.message}`);
    }
  }

  /**
   * Search by author name
   * @param {string} authorName - Author name
   * @param {number} start - Pagination offset
   * @returns {Promise<object>} - Search results
   */
  async searchByAuthor(authorName, start = 0) {
    const query = `author:"${authorName}"`;
    return this.search(query, start);
  }

  /**
   * Get articles citing a specific publication
   * @param {string} citesId - Cites ID from Google Scholar
   * @param {number} start - Pagination offset
   * @returns {Promise<object>} - Citing articles
   */
  async getCitedBy(citesId, start = 0) {
    try {
      const params = {
        engine: 'google_scholar',
        api_key: this.apiKey,
        cites: citesId,
        start: start,
        num: 10
      };

      console.log(`📚 Fetching citations for: ${citesId}`);
      
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 30000
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`SerpAPI Error: ${error.response.data.error || error.message}`);
      }
      throw new Error(`Network Error: ${error.message}`);
    }
  }

  /**
   * Get all versions of a publication
   * @param {string} clusterId - Cluster ID from Google Scholar
   * @returns {Promise<object>} - All versions
   */
  async getAllVersions(clusterId) {
    try {
      const params = {
        engine: 'google_scholar',
        api_key: this.apiKey,
        cluster: clusterId,
        num: 10
      };

      console.log(`🔗 Fetching versions for cluster: ${clusterId}`);
      
      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 30000
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`SerpAPI Error: ${error.response.data.error || error.message}`);
      }
      throw new Error(`Network Error: ${error.message}`);
    }
  }

  /**
   * Search with date range filter
   * @param {string} query - Search query
   * @param {number} yearFrom - Start year
   * @param {number} yearTo - End year
   * @param {number} start - Pagination offset
   * @returns {Promise<object>} - Search results
   */
  async searchByDateRange(query, yearFrom, yearTo, start = 0) {
    const options = {
      as_ylo: yearFrom,
      as_yhi: yearTo
    };
    return this.search(query, start, options);
  }

  /**
   * Fetch multiple pages of results
   * @param {string} query - Search query
   * @param {number} maxPages - Maximum number of pages to fetch
   * @returns {Promise<Array>} - All organic results
   */
  async searchMultiplePages(query, maxPages = 3) {
    const allResults = [];
    
    for (let page = 0; page < maxPages; page++) {
      const start = page * 10;
      
      try {
        const response = await this.search(query, start);
        
        if (!response.organic_results || response.organic_results.length === 0) {
          console.log(`📊 No more results after page ${page + 1}`);
          break;
        }
        
        allResults.push(...response.organic_results);
        console.log(`✅ Fetched page ${page + 1}/${maxPages} (${response.organic_results.length} results)`);
        
        // Rate limiting delay (2 seconds between requests)
        if (page < maxPages - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page + 1}:`, error.message);
        break;
      }
    }
    
    return allResults;
  }
}

module.exports = new SerpApiService();

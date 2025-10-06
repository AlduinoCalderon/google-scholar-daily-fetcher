/**
 * Parser Service - Utilities for parsing Google Scholar data
 */

class ParserService {
  /**
   * Parse publication info summary
   * Format: "Author1, Author2 - Source, Year - Publisher"
   * Example: "JL Harper - Population biology of plants., 1977 - cabdirect.org"
   * @param {string} summary - Publication info summary
   * @returns {object} - Parsed data
   */
  parsePublicationInfo(summary) {
    if (!summary) {
      return {
        authors: null,
        journal: null,
        year: null,
        publisher: null
      };
    }

    const parts = summary.split(' - ');
    
    // Extract authors (first part)
    const authors = parts[0]?.trim() || null;
    
    // Extract journal and year (second part)
    let journal = null;
    let year = null;
    
    if (parts[1]) {
      const sourceYear = parts[1].trim();
      const yearMatch = sourceYear.match(/\b(19|20)\d{2}\b/);
      
      if (yearMatch) {
        year = parseInt(yearMatch[0]);
        journal = sourceYear.replace(/,?\s*(19|20)\d{2}/, '').trim();
      } else {
        journal = sourceYear;
      }
    }
    
    // Extract publisher (third part)
    const publisher = parts[2]?.trim() || null;
    
    return {
      authors,
      journal,
      year,
      publisher
    };
  }

  /**
   * Parse a single organic result from SerpAPI
   * @param {object} result - Organic result object
   * @returns {object} - Parsed publication data
   */
  parseOrganicResult(result) {
    const publicationInfo = result.publication_info 
      ? this.parsePublicationInfo(result.publication_info.summary)
      : {};

    return {
      google_scholar_id: result.result_id || null,
      title: result.title || null,
      authors: publicationInfo.authors || null,
      publication_year: publicationInfo.year || null,
      journal: publicationInfo.journal || null,
      article_url: result.link || null,
      abstract: result.snippet || null,
      citation_count: result.inline_links?.cited_by?.total || 0,
      cites_id: result.inline_links?.cited_by?.cites_id || null,
      pdf_url: this.extractPdfUrl(result.resources),
      cluster_id: result.inline_links?.versions?.cluster_id || null,
      publisher: publicationInfo.publisher || null
    };
  }

  /**
   * Extract PDF URL from resources array
   * @param {Array} resources - Resources array from SerpAPI
   * @returns {string|null} - PDF URL or null
   */
  extractPdfUrl(resources) {
    if (!resources || !Array.isArray(resources)) {
      return null;
    }

    const pdfResource = resources.find(
      resource => resource.file_format?.toUpperCase() === 'PDF'
    );

    return pdfResource?.link || null;
  }

  /**
   * Parse multiple organic results
   * @param {Array} results - Array of organic results
   * @returns {Array} - Array of parsed publications
   */
  parseOrganicResults(results) {
    if (!results || !Array.isArray(results)) {
      return [];
    }

    return results.map(result => this.parseOrganicResult(result));
  }

  /**
   * Validate parsed publication data
   * @param {object} publication - Parsed publication data
   * @returns {boolean} - True if valid
   */
  isValidPublication(publication) {
    // At minimum, we need a title and google_scholar_id
    return !!(publication.title && publication.google_scholar_id);
  }

  /**
   * Filter out invalid publications
   * @param {Array} publications - Array of parsed publications
   * @returns {Array} - Filtered array
   */
  filterValidPublications(publications) {
    return publications.filter(pub => this.isValidPublication(pub));
  }

  /**
   * Extract search metadata
   * @param {object} searchData - Full SerpAPI response
   * @returns {object} - Metadata
   */
  extractMetadata(searchData) {
    return {
      total_results: searchData.search_information?.total_results || 0,
      time_taken: searchData.search_information?.time_taken_displayed || 0,
      query: searchData.search_parameters?.q || null,
      current_page: this.calculateCurrentPage(searchData.search_parameters?.start || 0),
      has_next: !!searchData.pagination?.next
    };
  }

  /**
   * Calculate current page from start offset
   * @param {number} start - Start offset
   * @returns {number} - Page number (1-indexed)
   */
  calculateCurrentPage(start) {
    return Math.floor(start / 10) + 1;
  }

  /**
   * Sanitize string for database storage
   * @param {string} str - Input string
   * @returns {string} - Sanitized string
   */
  sanitizeString(str) {
    if (!str) return null;
    
    // Remove excessive whitespace and trim
    return str.replace(/\s+/g, ' ').trim();
  }

  /**
   * Prepare publication for database insertion
   * @param {object} publication - Parsed publication
   * @returns {object} - Database-ready publication
   */
  prepareForDatabase(publication) {
    return {
      google_scholar_id: publication.google_scholar_id,
      title: this.sanitizeString(publication.title),
      authors: this.sanitizeString(publication.authors),
      publication_year: publication.publication_year,
      journal: this.sanitizeString(publication.journal),
      article_url: publication.article_url,
      abstract: this.sanitizeString(publication.abstract),
      citation_count: publication.citation_count || 0,
      cites_id: publication.cites_id,
      pdf_url: publication.pdf_url,
      cluster_id: publication.cluster_id,
      publisher: this.sanitizeString(publication.publisher)
    };
  }
}

module.exports = new ParserService();

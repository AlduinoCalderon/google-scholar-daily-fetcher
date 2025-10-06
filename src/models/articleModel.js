const { pool } = require('../config/database');

class ArticleModel {
  /**
   * Create a new article
   * @param {object} articleData - Article data
   * @returns {Promise<number>} - Inserted ID
   */
  async create(articleData) {
    const query = `
      INSERT INTO articles (
        google_scholar_id, paper_title, authors, publication_year, 
        journal, article_url, abstract_text, citation_count, 
        cites_id, pdf_url, publisher
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      articleData.google_scholar_id,
      articleData.paper_title,
      articleData.authors,
      articleData.publication_year,
      articleData.journal,
      articleData.article_url,
      articleData.abstract_text,
      articleData.citation_count || 0,
      articleData.cites_id,
      articleData.pdf_url,
      articleData.publisher
    ];

    try {
      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      // Handle duplicate entry
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error(`Article with google_scholar_id '${articleData.google_scholar_id}' already exists`);
      }
      throw error;
    }
  }

  /**
   * Check if article exists by Google Scholar ID
   * @param {string} googleScholarId - Google Scholar ID
   * @returns {Promise<boolean>} - True if exists
   */
  async existsByGoogleScholarId(googleScholarId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM articles 
      WHERE google_scholar_id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.execute(query, [googleScholarId]);
    return rows[0].count > 0;
  }

  /**
   * Find article by Google Scholar ID
   * @param {string} googleScholarId - Google Scholar ID
   * @returns {Promise<object|null>} - Article or null
   */
  async findByGoogleScholarId(googleScholarId) {
    const query = `
      SELECT * FROM articles 
      WHERE google_scholar_id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.execute(query, [googleScholarId]);
    return rows[0] || null;
  }

  /**
   * Find article by ID
   * @param {number} id - Article ID
   * @returns {Promise<object|null>} - Article or null
   */
  async findById(id) {
    const query = `
      SELECT * FROM articles 
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get all active articles with pagination
   * @param {number} limit - Number of results per page
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} - Articles array
   */
  async findAll(limit = 10, offset = 0) {
    const query = `
      SELECT * FROM articles 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.execute(query, [limit, offset]);
    return rows;
  }

  /**
   * Search articles by title
   * @param {string} searchTerm - Search term
   * @param {number} limit - Results limit
   * @param {number} offset - Offset
   * @returns {Promise<Array>} - Articles array
   */
  async searchByTitle(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM articles 
      WHERE paper_title LIKE ? AND deleted_at IS NULL
      ORDER BY citation_count DESC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.execute(query, [`%${searchTerm}%`, limit, offset]);
    return rows;
  }

  /**
   * Count total active articles
   * @returns {Promise<number>} - Total count
   */
  async count() {
    const query = `
      SELECT COUNT(*) as total 
      FROM articles 
      WHERE deleted_at IS NULL
    `;
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }

  /**
   * Get statistics
   * @returns {Promise<object>} - Statistics object
   */
  async getStatistics() {
    const queries = {
      total: 'SELECT COUNT(*) as count FROM articles WHERE deleted_at IS NULL',
      totalCitations: 'SELECT SUM(citation_count) as total FROM articles WHERE deleted_at IS NULL',
      avgCitations: 'SELECT AVG(citation_count) as avg FROM articles WHERE deleted_at IS NULL',
      byYear: `
        SELECT publication_year, COUNT(*) as count 
        FROM articles 
        WHERE publication_year IS NOT NULL AND deleted_at IS NULL
        GROUP BY publication_year 
        ORDER BY publication_year DESC 
        LIMIT 10
      `
    };

    const [totalResult] = await pool.execute(queries.total);
    const [citationsResult] = await pool.execute(queries.totalCitations);
    const [avgResult] = await pool.execute(queries.avgCitations);
    const [yearResult] = await pool.execute(queries.byYear);

    return {
      total_articles: totalResult[0].count,
      total_citations: citationsResult[0].total || 0,
      average_citations: Math.round(avgResult[0].avg || 0),
      articles_by_year: yearResult
    };
  }
}

module.exports = new ArticleModel();

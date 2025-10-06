const { pool } = require('../config/database');

const createArticlesTable = `
  CREATE TABLE IF NOT EXISTS articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    paper_title VARCHAR(500) NOT NULL,
    authors VARCHAR(1000),
    publication_year INTEGER,
    journal VARCHAR(500),
    article_url VARCHAR(500),
    abstract_text TEXT,
    google_scholar_id VARCHAR(50) UNIQUE,
    citation_count INTEGER DEFAULT 0,
    cites_id VARCHAR(50),
    pdf_url VARCHAR(500),
    publisher VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_google_scholar_id (google_scholar_id),
    INDEX idx_publication_year (publication_year),
    INDEX idx_citation_count (citation_count),
    INDEX idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createAuthorsTable = `
  CREATE TABLE IF NOT EXISTS authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    article_count INT DEFAULT 0,
    total_citations INT DEFAULT 0,
    UNIQUE INDEX idx_full_name (full_name),
    INDEX idx_article_count (article_count),
    INDEX idx_total_citations (total_citations),
    INDEX idx_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createArticleAuthorsTable = `
  CREATE TABLE IF NOT EXISTS article_authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    author_position INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_article_author (article_id, author_id),
    INDEX idx_author_id (author_id),
    INDEX idx_article_id (article_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const runMigrations = async () => {
  let connection;
  
  try {
    console.log('🚀 Starting database migrations...');
    
    connection = await pool.getConnection();
    
    // Create articles table
    await connection.query(createArticlesTable);
    console.log('✅ Articles table created successfully');
    
    // Create authors table
    await connection.query(createAuthorsTable);
    console.log('✅ Authors table created successfully');
    
    // Create article_authors relationship table
    await connection.query(createArticleAuthorsTable);
    console.log('✅ Article_authors table created successfully');
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

const serpApiService = require('../services/serpApiService');
const parserService = require('../services/parserService');
const articleModel = require('../models/articleModel');

class AuthorArticleController {
  /**
   * Fetch and save 3 non-registered articles for 3 authors
   * GET /api/authors/fetch-articles?authors=Author1,Author2,Author3
   */
  async fetchArticlesByAuthors(req, res, next) {
    try {
      const { authors } = req.query;

      // Validate authors parameter
      if (!authors) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "authors" is required (comma-separated list of 3 author names)'
        });
      }

      // Parse and validate author list
      const authorList = authors.split(',').map(a => a.trim()).filter(a => a);
      
      if (authorList.length !== 3) {
        return res.status(400).json({
          success: false,
          error: 'Exactly 3 author names are required, separated by commas'
        });
      }

      console.log(`🔍 Fetching articles for authors: ${authorList.join(', ')}`);

      const results = {
        authors: [],
        total_fetched: 0,
        total_saved: 0,
        total_already_exists: 0,
        articles_saved: []
      };

      // Process each author
      for (const authorName of authorList) {
        const authorResult = {
          author: authorName,
          fetched: 0,
          saved: 0,
          already_exists: 0,
          articles: []
        };

        try {
          // Search for author's publications
          console.log(`📚 Searching for: ${authorName}`);
          const searchData = await serpApiService.searchByAuthor(authorName, 0);
          
          if (!searchData.organic_results || searchData.organic_results.length === 0) {
            console.log(`⚠️  No results found for ${authorName}`);
            authorResult.error = 'No articles found';
            results.authors.push(authorResult);
            continue;
          }

          // Parse results
          const parsedArticles = parserService.parseOrganicResults(searchData.organic_results);
          const validArticles = parserService.filterValidPublications(parsedArticles);
          
          authorResult.fetched = validArticles.length;
          results.total_fetched += validArticles.length;

          // Try to save up to 3 non-registered articles for this author
          let savedCount = 0;
          
          for (const article of validArticles) {
            if (savedCount >= 3) break; // Maximum 3 articles per author

            // Check if article already exists
            const exists = await articleModel.existsByGoogleScholarId(article.google_scholar_id);
            
            if (exists) {
              console.log(`⏭️  Article already exists: ${article.title}`);
              authorResult.already_exists++;
              results.total_already_exists++;
              continue;
            }

            // Prepare article for database
            const dbArticle = {
              google_scholar_id: article.google_scholar_id,
              paper_title: parserService.sanitizeString(article.title),
              authors: parserService.sanitizeString(article.authors),
              publication_year: article.publication_year,
              journal: parserService.sanitizeString(article.journal),
              article_url: article.article_url,
              abstract_text: parserService.sanitizeString(article.abstract),
              citation_count: article.citation_count || 0,
              cites_id: article.cites_id,
              pdf_url: article.pdf_url,
              publisher: parserService.sanitizeString(article.publisher)
            };

            try {
              // Save to database
              const articleId = await articleModel.create(dbArticle);
              
              console.log(`✅ Saved article: ${dbArticle.paper_title}`);
              
              authorResult.saved++;
              savedCount++;
              results.total_saved++;
              
              authorResult.articles.push({
                id: articleId,
                google_scholar_id: dbArticle.google_scholar_id,
                title: dbArticle.paper_title,
                citation_count: dbArticle.citation_count
              });

              results.articles_saved.push({
                article_id: articleId,
                title: dbArticle.paper_title,
                author_searched: authorName
              });

            } catch (saveError) {
              if (saveError.message.includes('already exists')) {
                authorResult.already_exists++;
                results.total_already_exists++;
              } else {
                console.error(`❌ Error saving article: ${saveError.message}`);
              }
            }
          }

          // Add small delay between author searches (rate limiting)
          if (authorList.indexOf(authorName) < authorList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (authorError) {
          console.error(`❌ Error processing ${authorName}:`, authorError.message);
          authorResult.error = authorError.message;
        }

        results.authors.push(authorResult);
      }

      // Return success response with 200 status
      return res.status(200).json({
        success: true,
        message: `Processed ${authorList.length} authors`,
        summary: {
          total_fetched: results.total_fetched,
          total_saved: results.total_saved,
          total_already_exists: results.total_already_exists
        },
        authors: results.authors,
        articles_saved: results.articles_saved
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorArticleController();

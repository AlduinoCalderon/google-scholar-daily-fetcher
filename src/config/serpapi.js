require('dotenv').config();

const serpApiConfig = {
  apiKey: process.env.SERP_API_KEY,
  baseUrl: 'https://serpapi.com/search.json',
  engine: 'google_scholar',
  defaultParams: {
    engine: 'google_scholar',
    api_key: process.env.SERP_API_KEY,
    num: 10, // Results per page
    no_cache: false // Allow cached results
  }
};

module.exports = serpApiConfig;

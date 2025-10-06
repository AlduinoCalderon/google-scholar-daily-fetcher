const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const authorRoutes = require('./routes/authorRoutes');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Apply rate limiting to all routes
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const connection = await require('./config/database').pool.getConnection();
    connection.release();
    
    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      serpApiKey: process.env.SERP_API_KEY ? 'configured' : 'missing'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Google Scholar API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      fetchByAuthors: 'GET /api/authors/fetch-articles?authors=Author1,Author2,Author3'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// API Routes
app.use('/api/authors', authorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    status: 404
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('⚠️  Server starting without database connection');
      console.error('   Please check your database configuration');
    }

    // Check for API key
    if (!process.env.SERP_API_KEY || process.env.SERP_API_KEY === 'your_serpapi_key_here') {
      console.warn('⚠️  SERP_API_KEY not configured properly');
      console.warn('   External API features will not work');
    } else {
      console.log('✅ SERP_API_KEY configured');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('\n🚀 Server is running!');
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
      console.log('\n📚 Available endpoints:');
      console.log(`   GET  /health`);
      console.log(`   GET  /api/authors/fetch-articles?authors=Name1,Name2,Name3`);
      console.log('\n💡 Press Ctrl+C to stop\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

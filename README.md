# Google Scholar Daily Fetcher

Automated GitHub Actions service that fetches articles from Google Scholar API daily and stores parsed data in a MySQL cloud database.

## 🎯 What This Does

This is a **GitHub Actions automation** that:
- ✅ Runs automatically every day at 2:00 AM UTC
- ✅ Fetches articles for 3 different researchers each day (rotating through 7 author sets)
- ✅ Parses and stores article data in a MySQL cloud database
- ✅ Prevents duplicate entries using Google Scholar IDs
- ✅ Can be triggered manually with custom author names

## 🔧 Technology Stack

- **Runtime**: Node.js + Express.js
- **API Integration**: SerpAPI (Google Scholar)
- **Database**: MySQL (Cloud hosted - Clever Cloud)
- **Automation**: GitHub Actions (scheduled cron job)
- **Architecture**: MVC pattern

## � Database Schema

Articles are stored with the following fields:
- Google Scholar ID (unique identifier)
- Title, authors, publication year
- Journal, publisher, abstract
- Citation count, article URL, PDF URL
- Timestamps (created, updated, soft delete)

## 🚀 Setup Instructions

### 1. Fork/Clone This Repository

```bash
git clone <your-repo-url>
cd API
```

### 2. Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERP_API_KEY` | Your SerpAPI key from serpapi.com | `abc123...` |
| `DB_HOST` | MySQL database host | `bvw5otx6smb5c61tmtbw-mysql.services.clever-cloud.com` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `bvw5otx6smb5c61tmtbw` |
| `DB_USER` | Database username | `urcxyz...` |
| `DB_PASSWORD` | Database password | `your_password` |

### 3. Database Setup

Run the migration script once to create tables:

```bash
npm install
npm run migrate
```

Or manually create the tables using the SQL in `src/database/migrate.js`.

## ⚙️ GitHub Actions Workflow

The workflow runs daily and rotates through different researcher sets:

- **Monday**: AI Researchers (Hinton, LeCun, Bengio)
- **Tuesday**: Computer Scientists (Knuth, Turing, Hopper)
- **Wednesday**: Physicists (Einstein, Feynman, Hawking)
- **Thursday**: ML Researchers (Ng, Li, Thrun)
- **Friday**: Neuroscientists (Kandel, Koch, Tonegawa)
- **Saturday**: Biologists (Watson, Crick, Franklin)
- **Sunday**: Mathematicians (Turing, Nash, Erdős)

### Manual Trigger

You can also run the workflow manually:
1. Go to **Actions** tab in your GitHub repo
2. Select "Daily Google Scholar Fetcher"
3. Click "Run workflow"
4. Enter 3 comma-separated author names

## 📂 Project Structure

```
API/
├── .github/workflows/
│   └── daily-fetch.yml          # GitHub Actions workflow
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   └── serpapi.js           # SerpAPI configuration
│   ├── controllers/
│   │   └── authorArticleController.js  # Main logic
│   ├── models/
│   │   └── articleModel.js      # Database operations
│   ├── services/
│   │   ├── serpApiService.js    # API integration
│   │   └── parserService.js     # Data parsing
│   ├── routes/
│   │   └── authorRoutes.js      # API routes
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling
│   │   └── rateLimiter.js       # Rate limiting
│   ├── database/
│   │   └── migrate.js           # Database migrations
│   └── server.js                # Express app
├── .env.example                 # Environment template
├── package.json
└── README.md
```

## 🔍 How It Works

1. **GitHub Actions triggers** the workflow on schedule or manually
2. **Express server starts** temporarily to handle the request
3. **Endpoint receives** 3 author names as parameters
4. **SerpAPI searches** Google Scholar for each author
5. **Parser extracts** article data (title, authors, citations, etc.)
6. **Database checks** for duplicates using `google_scholar_id`
7. **Up to 3 new articles per author** are saved (max 9 per run)
8. **Results logged** and workflow completes

## 📈 Monitoring

Check workflow runs in the **Actions** tab:
- View execution logs
- Download artifacts (fetch results JSON)
- Monitor success/failure rates

## 🛠️ Local Development

For testing locally:

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your credentials

# Run migrations
npm run migrate

# Start server
npm start

# Test endpoint
curl "http://localhost:8080/api/authors/fetch-articles?authors=Author1,Author2,Author3"
```

## 📝 API Endpoint

**GET** `/api/authors/fetch-articles`

**Parameters:**
- `authors` (string, required): Comma-separated list of exactly 3 author names

**Example:**
```
/api/authors/fetch-articles?authors=Geoffrey Hinton,Yann LeCun,Yoshua Bengio
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_fetched": 30,
    "total_saved": 7,
    "total_already_exists": 23
  },
  "authors": [...]
}
```

## 📄 License

MIT

- API requests are rate-limited to prevent abuse
- Default: 100 requests per 15 minutes per IP
- Adjustable in `src/middleware/rateLimiter.js`

## Error Handling

All errors are handled centrally and return consistent JSON responses:
```json
{
  "error": "Error message",
  "status": 400
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

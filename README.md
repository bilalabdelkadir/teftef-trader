# TefTef Trader

AI-powered trading analysis platform that automates market analysis and generates trade signals.

## Features

- **AI Market Analysis** - Analyze Forex, Crypto, and Stock markets using Google Gemini AI
- **Trade Signals** - Get entry, stop-loss, and take-profit levels with confidence scores
- **Custom Strategies** - Create your own trading strategies with RAG support
- **Email Alerts** - Receive notifications when high-confidence signals are found
- **Watchlist** - Track your favorite symbols and get automated scans
- **Risk Management** - Automatic position sizing based on your account and risk settings

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, Radix UI
- **Backend**: Next.js API Routes, Better Auth
- **Database**: PostgreSQL, Prisma ORM
- **AI**: Google Gemini API (free tier), OpenRouter (fallback)
- **Email**: Resend, React Email
- **Scheduler**: Trigger.dev
- **Cache**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd teftef-trader
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with required values (see below)

5. Set up the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

6. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

```bash
# Authentication
BETTER_AUTH_SECRET=       # Random string for auth encryption
BETTER_AUTH_URL=          # Your app URL (e.g., http://localhost:3000)

# Database
DATABASE_URL=             # PostgreSQL connection string

# App URL
NEXT_PUBLIC_APP_URL=      # Public app URL

# Market Data APIs
TEWELEVE_DATA=            # Twelve Data API key (forex/crypto)
FINNHUB_API_KEY=          # Finnhub API key (stocks)

# AI Provider
AI_PROVIDER=gemini        # "gemini" (free) or "openrouter" (paid)
GOOGLE_GENERATIVE_AI_API_KEY=  # Google AI API key
OPENROUTER_API_KEY=       # OpenRouter API key (optional fallback)

# Email
RESEND_API_KEY=           # Resend API key
RESEND_DOMAIN=            # Your verified Resend domain

# Caching
UPSTASH_REDIS_REST_URL=   # Upstash Redis URL
UPSTASH_REDIS_REST_TOKEN= # Upstash Redis token
```

## API Integrations

### Google Gemini AI (Free Tier)
1. Go to [Google AI Studio](https://ai.google.dev)
2. Create an API key
3. Free tier: 15 requests/minute, 1,500 requests/day

### Twelve Data (Market Data)
1. Sign up at [Twelve Data](https://twelvedata.com)
2. Get your API key from the dashboard

### Finnhub (Stock Data)
1. Sign up at [Finnhub](https://finnhub.io)
2. Get your free API key

### Resend (Email)
1. Sign up at [Resend](https://resend.com)
2. Verify your domain
3. Get your API key

### Upstash Redis (Caching)
1. Sign up at [Upstash](https://upstash.com)
2. Create a Redis database
3. Copy the REST URL and token

## Project Structure

```
teftef-trader/
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── (auth)/           # Auth pages (login, signup)
│   ├── dashboard/        # Main dashboard
│   ├── analyze/          # Symbol analysis
│   ├── signals/          # Trade signals
│   ├── strategies/       # Custom strategies
│   └── settings/         # User settings
├── components/           # React components
├── lib/                  # Utilities and services
│   ├── ai-analysis.ts    # AI analysis logic
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Prisma client
│   └── email.ts          # Email templates
├── prisma/               # Database schema
├── src/trigger/          # Trigger.dev jobs
└── emails/               # React Email templates
```

## License

MIT

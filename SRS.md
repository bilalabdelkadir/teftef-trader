# Software Requirements Specification (SRS)

## TefTef Trader - AI Trading Analysis Platform

---

## 1. Introduction

### 1.1 Project Name
TefTef Trader

### 1.2 Role
Trading Analyst in Financial Services

### 1.3 Purpose
Automate 90% of trading analysis using AI. The platform provides intelligent market analysis, generates trade signals with specific entry/exit levels, and delivers automated alerts to help traders make better decisions.

---

## 2. Problem Statement

### 2.1 Current Challenges
- **Time-consuming analysis**: Manual trading analysis requires hours of chart review and data gathering
- **Missed opportunities**: Traders miss trading opportunities due to delayed analysis
- **Inconsistent quality**: Human analysis varies in quality and can be affected by emotions
- **Information overload**: Too many markets and timeframes to monitor manually

### 2.2 Target Users
- Individual traders managing their own portfolios
- Part-time traders who cannot monitor markets constantly
- Traders wanting AI-powered second opinions on their analysis

---

## 3. Solution Overview

TefTef Trader solves these problems by providing:

- **AI-powered market analysis**: Uses Google Gemini AI to analyze price action, patterns, and market structure
- **Automated trade signal generation**: Generates signals with specific entry, stop-loss, and take-profit levels
- **Email alerts**: Sends notifications when high-confidence trading opportunities are found
- **Custom strategy support**: Users can define their own trading strategies using RAG (Retrieval-Augmented Generation)
- **Risk management**: Automatically calculates position sizes based on user's account size and risk tolerance

---

## 4. Key Features

### 4.1 Real-time Market Analysis
- Support for multiple markets: Forex, Crypto, Stocks
- Multiple timeframes: 1m, 5m, 15m, 1h, 4h, 1d
- AI-powered pattern recognition and trend analysis

### 4.2 AI Trade Signals
- Entry price with clear direction (long/short)
- Stop-loss level for risk management
- Take-profit level for reward targeting
- Risk-reward ratio calculation
- Confidence score (0-100%)
- Detailed reasoning for each signal

### 4.3 Custom Trading Strategies
- Built-in strategies: ICT/SMC, Technical Analysis, AI-Decide
- Custom strategy creation with user-defined rules
- RAG-based strategy matching using pasted trading content

### 4.4 Automated Email Notifications
- Trade signal alerts with full details
- Scheduled market scans (7 AM & 1 PM UTC on weekdays)
- Configurable email preferences

### 4.5 Watchlist Management
- Add/remove symbols to personal watchlist
- Automatic market detection (Forex/Crypto/Stocks)
- Watchlist-based automated scanning

### 4.6 Risk Management
- Account size configuration
- Risk per trade percentage (0.1% - 10%)
- Automatic position size calculation

---

## 5. Technical Architecture

### 5.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1 | React framework with App Router |
| React | 19.2 | UI library |
| TailwindCSS | 4.x | Styling |
| Radix UI | 1.4 | Accessible components |
| React Hook Form | 7.x | Form handling |
| Zod | 4.x | Schema validation |

### 5.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.1 | REST API endpoints |
| Better Auth | 1.4 | Authentication |
| AI SDK | 6.x | AI integration |

### 5.3 Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | - | Primary database |
| Prisma | 7.2 | ORM and migrations |

### 5.4 AI
| Technology | Purpose |
|------------|---------|
| Google Gemini API | Market analysis (free tier: 15 req/min, 1500/day) |
| OpenRouter | Fallback AI provider (paid) |

### 5.5 Scheduler
| Technology | Version | Purpose |
|------------|---------|---------|
| Trigger.dev | 4.3 | Background job scheduling |

---

## 6. Third-Party APIs

### 6.1 Google Gemini AI (Primary)
- **Purpose**: AI-powered market analysis
- **Tier**: Free tier
- **Limits**: 15 requests/minute, 1,500 requests/day
- **Sign up**: https://ai.google.dev

### 6.2 OpenRouter (Fallback)
- **Purpose**: Alternative AI provider if Gemini quota exhausted
- **Tier**: Paid
- **Sign up**: https://openrouter.ai

### 6.3 Twelve Data
- **Purpose**: Forex and Crypto market data
- **Data**: Real-time and historical prices
- **Sign up**: https://twelvedata.com

### 6.4 Finnhub
- **Purpose**: Stock market data
- **Data**: Real-time quotes and company info
- **Sign up**: https://finnhub.io

### 6.5 Resend
- **Purpose**: Email notifications
- **Features**: Trade signal alerts, React Email templates
- **Sign up**: https://resend.com

### 6.6 Upstash Redis
- **Purpose**: Caching and rate limiting
- **Features**: Serverless Redis
- **Sign up**: https://upstash.com

---

## 7. User Workflows

### 7.1 Onboarding Flow
1. User signs up with email/password
2. User completes onboarding:
   - Sets account size
   - Sets risk per trade percentage
   - Selects default strategy
   - Enables/disables email alerts
3. User adds symbols to watchlist
4. User is ready to analyze markets

### 7.2 Analysis Workflow
1. User selects a symbol (e.g., EUR/USD, BTC/USD, AAPL)
2. User chooses timeframe and strategy
3. AI analyzes market and generates signal
4. Signal shows entry, SL, TP, confidence, and reasoning
5. Valid signals are saved to history

### 7.3 Signal Management
1. View all generated signals in dashboard
2. Filter by market, status, or time period
3. Update signal status (new, active, closed)
4. Review signal reasoning and strategy used

### 7.4 Automated Scanning
1. Scheduled scans run at 7 AM and 1 PM UTC (weekdays)
2. System analyzes all symbols in users' watchlists
3. High-confidence signals trigger email notifications
4. All valid signals are saved to user's history

---

## 8. API Endpoints

### 8.1 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/*` | Better Auth endpoints |

### 8.2 Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Run AI market analysis |

### 8.3 Signals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/signals` | Get user's trade signals |
| GET | `/api/signals/[id]` | Get specific signal |
| PATCH | `/api/signals/[id]` | Update signal status |

### 8.4 Watchlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get user's watchlist |
| POST | `/api/watchlist` | Add symbol to watchlist |
| DELETE | `/api/watchlist/[id]` | Remove from watchlist |

### 8.5 Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update user settings |

### 8.6 Strategies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/strategies` | Get user's custom strategies |
| POST | `/api/strategies` | Create new strategy |
| GET | `/api/strategies/[id]` | Get specific strategy |
| PATCH | `/api/strategies/[id]` | Update strategy |
| DELETE | `/api/strategies/[id]` | Delete strategy |
| POST | `/api/strategies/[id]/contents` | Link content to strategy |

### 8.7 Strategy Contents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contents` | Get user's strategy contents |
| POST | `/api/contents` | Create new content |
| GET | `/api/contents/[id]` | Get specific content |
| DELETE | `/api/contents/[id]` | Delete content |

### 8.8 Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prices` | Get market prices |
| POST | `/api/onboarding` | Complete onboarding |

---

## 9. Database Models

### 9.1 User
Stores user account information.
- `id`, `name`, `email`, `emailVerified`, `image`, `isTrader`

### 9.2 UserSettings
User preferences and trading configuration.
- `accountSize`: Default $10,000
- `riskPerTrade`: Default 1%
- `defaultStrategy`: Default "ai_decide"
- `emailAlerts`: Default true
- `onboardingDone`: Default false

### 9.3 Watchlist
User's tracked symbols.
- `symbol`: Trading symbol (e.g., "EUR/USD")
- `market`: Market type (forex, crypto, stocks)

### 9.4 TradeSignal
AI-generated trade signals.
- `symbol`, `market`, `direction`, `entryPrice`
- `stopLoss`, `takeProfit`, `riskReward`
- `positionSize`, `confidence`, `reasoning`
- `strategy`, `status`, `validUntil`, `interval`

### 9.5 UserStrategy
Custom trading strategies.
- `name`, `description`, `isActive`
- `baseStrategy`, `customPrompt`

### 9.6 StrategyContent
Pasted trading content for RAG.
- `name`, `content`, `description`, `status`

### 9.7 ContentChunk
Vector chunks from strategy content.
- `text`, `chunkIndex`

---

## 10. Automation

### 10.1 Scheduled Market Scans
- **Schedule**: 7:00 AM and 1:00 PM UTC, Monday to Friday
- **Process**:
  1. Fetch all users with email alerts enabled
  2. Get all unique symbols from watchlists
  3. Run AI analysis on each symbol
  4. Create signals for users watching each symbol
  5. Send email notifications for valid signals

### 10.2 Email Alerts
- **Trigger**: When valid trade signal is generated
- **Content**: Symbol, direction, entry, SL, TP, R:R, confidence, reasoning
- **Provider**: Resend with React Email templates

---

## 11. Application Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | User login |
| `/signup` | User registration |
| `/onboarding` | New user setup |
| `/dashboard` | Main dashboard |
| `/analyze/[symbol]` | Symbol analysis page |
| `/signals/[id]` | Signal detail page |
| `/strategies` | Custom strategies management |
| `/settings` | User settings |
| `/alerts` | Alert preferences |

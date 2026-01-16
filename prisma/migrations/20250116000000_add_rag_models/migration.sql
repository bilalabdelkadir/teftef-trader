-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add new columns to TradeSignal
ALTER TABLE "TradeSignal" ADD COLUMN "strategyId" TEXT;
ALTER TABLE "TradeSignal" ADD COLUMN "ragContext" TEXT;

-- Create StrategyContent table
CREATE TABLE "StrategyContent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyContent_pkey" PRIMARY KEY ("id")
);

-- Create ContentChunk table with vector column
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(1536),

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- Create UserStrategy table
CREATE TABLE "UserStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "baseStrategy" TEXT,
    "customPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStrategy_pkey" PRIMARY KEY ("id")
);

-- Create StrategyContentLink table
CREATE TABLE "StrategyContentLink" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    CONSTRAINT "StrategyContentLink_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "TradeSignal_strategyId_idx" ON "TradeSignal"("strategyId");
CREATE INDEX "StrategyContent_userId_idx" ON "StrategyContent"("userId");
CREATE INDEX "ContentChunk_contentId_idx" ON "ContentChunk"("contentId");
CREATE INDEX "UserStrategy_userId_idx" ON "UserStrategy"("userId");

-- Create unique constraints
CREATE UNIQUE INDEX "UserStrategy_userId_name_key" ON "UserStrategy"("userId", "name");
CREATE UNIQUE INDEX "StrategyContentLink_strategyId_contentId_key" ON "StrategyContentLink"("strategyId", "contentId");

-- Create vector index for similarity search (IVFFlat with cosine similarity)
CREATE INDEX "ContentChunk_embedding_idx" ON "ContentChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add foreign keys
ALTER TABLE "TradeSignal" ADD CONSTRAINT "TradeSignal_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "UserStrategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StrategyContent" ADD CONSTRAINT "StrategyContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "StrategyContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStrategy" ADD CONSTRAINT "UserStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyContentLink" ADD CONSTRAINT "StrategyContentLink_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "UserStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyContentLink" ADD CONSTRAINT "StrategyContentLink_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "StrategyContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

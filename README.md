# Stock Ticker Semantic Search API

This is a FastAPI application that enables **semantic search** and **conversational Q&A** over stock company descriptions. It uses **OpenAI embeddings**, **Pinecone vector database**, and **LangChain** for conversational retrieval.

## Features

- **Semantic Search** over stock ticker business summaries
- **Conversational Q&A** with memory support
- **Ticker Data Refresh** to keep the vector store updated
- **Add Single Ticker** dynamically
- **Detailed Ticker Info Retrieval**
- **Parallel Processing** for fast Pinecone population

## Tech Stack

- **FastAPI** - API Framework
- **Pinecone** - Vector database
- **OpenAI Embeddings** - Text embedding model
- **LangChain** - Conversational AI chaining
- **YFinance** - Stock market data
- **ThreadPoolExecutor** - Concurrency for fast uploads

## Environment Variables

Set up a `.env` file with the following keys:

```bash
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENV=us-east-1  # or your region
OPENAI_API_KEY=your-openai-api-key
```

## How It Works

1. **Startup**

   - Checks if the Pinecone index (`stock-ticker`) exists.
   - If not, it creates it and populates it with company descriptions from a GitHub JSON file.

2. **Ticker Description Fetching**

   - Downloads business summaries using the `yfinance` library.

3. **Text Processing**

   - Splits long summaries into chunks using `RecursiveCharacterTextSplitter`.

4. **Vectorization**

   - Converts text chunks into embedding vectors using OpenAI.

5. **Storage**

   - Inserts vectors into Pinecone under the ticker metadata.

## API Endpoints

### `/text_search` (POST)

**Input**: Query string

**Description**: Perform a semantic similarity search and return the top 5 matching tickers.

### `/qna_search` (POST)

**Input**: Query string + optional session\_id

**Description**: Conversational Q&A with memory support to maintain chat context.

### `/refresh` (POST)

**Description**: Recreate the Pinecone index and re-populate it from scratch.

### `/add_ticker_to_db` (POST)

**Input**: A single stock ticker symbol

**Description**: Adds a new ticker's description to the Pinecone index.

### `/ticker_info/{ticker_name}` (GET)

**Input**: Ticker symbol as path parameter

**Description**: Fetches detailed information (business summary) for a given ticker.

## Setup Instructions

```bash
git clone https://github.com/your-repo/stock-search-api.git
cd stock-search-api
pip install -r requirements.txt
cd backend
uvicorn main:app --reload
cd frontend
npm install
npm run dev
```

## Notes

- **Batch size** and **concurrency** are configurable for faster data population.
- **Session memory** is handled in-memory and should be persisted separately for production use.
- **Future work**: Use financial information from Yahoo Finance like ticker.income_stmt, ticker.balance_sheet, ticker.cashflow, etc.
---

**Built using FastAPI, LangChain, OpenAI, and Pinecone.**


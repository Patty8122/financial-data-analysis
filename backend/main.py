import os
import json
import time
import requests
import yfinance as yf
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from threading import Thread

# --- CONFIGURATION ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1")  # Unused in v3 SDK
PINECONE_INDEX_NAME = "stock-ticker-nlp"
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"
TICKER_JSON_URL = "https://raw.githubusercontent.com/team-headstart/Financial-Analysis-and-Automation-with-LLMs/main/company_tickers.json"
UPDATE_INTERVAL = 60 * 60 * 24  # 24 hours

# --- FASTAPI APP ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBALS ---
model = None
pinecone_client = None
pinecone_index = None
ticker_cache = {}
last_update_time = 0

# --- UTILS ---

def get_company_tickers():
    response = requests.get(TICKER_JSON_URL)
    if response.status_code == 200:
        company_tickers = json.loads(response.content.decode('utf-8'))
        return [v['ticker'] for v in company_tickers.values()]
    else:
        print(f"Failed to download tickers. Status code: {response.status_code}")
        return []

def get_stock_info(symbol: str) -> dict:
    try:
        data = yf.Ticker(symbol)
        stock_info = data.info
        return {
            "symbol": stock_info.get('symbol', symbol),
            "name": stock_info.get('longName', ''),
            "business_summary": stock_info.get('longBusinessSummary', ''),
            "industry": stock_info.get('industry', ''),
            "sector": stock_info.get('sector', ''),
            "country": stock_info.get('country', ''),
        }
    except Exception as e:
        print(f"Error fetching info for {symbol}: {e}")
        return None

def embed_text(text: str) -> np.ndarray:
    return model.encode([text or ""])[0]

def upsert_to_pinecone(symbol, embedding, metadata):
    pinecone_index.upsert(vectors=[{
        "id": symbol,
        "values": embedding.tolist(),
        "metadata": metadata
    }])

def refresh_ticker_data():
    global ticker_cache, last_update_time
    print("Refreshing ticker data...")
    tickers = get_company_tickers()
    for symbol in tickers:
        info = get_stock_info(symbol)
        if not info or not info["business_summary"]:
            continue
        if symbol not in ticker_cache or ticker_cache[symbol] != info:
            embedding = embed_text(info["business_summary"])
            upsert_to_pinecone(symbol, embedding, info)
            ticker_cache[symbol] = info

    # Remove deleted tickers
    stats = pinecone_index.describe_index_stats().to_dict()
    current_ids = set(stats.get("total_vector_count", []))
    to_delete = list(current_ids - set(ticker_cache.keys()))
    if to_delete:
        pinecone_index.delete(ids=to_delete)

    last_update_time = time.time()
    print("Ticker data refresh complete.")

def background_updater():
    while True:
        try:
            refresh_ticker_data()
        except Exception as e:
            print(f"Background update error: {e}")
        time.sleep(UPDATE_INTERVAL)

# --- FASTAPI EVENTS ---

@app.on_event("startup")
def on_startup():
    global model, pinecone_client, pinecone_index
    model = SentenceTransformer(EMBEDDING_MODEL)
    pinecone_client = Pinecone(api_key=PINECONE_API_KEY)

    # Create index if needed
    if PINECONE_INDEX_NAME not in pinecone_client.list_indexes().names():
        pinecone_client.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=768,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")  # Adjust as needed
        )
        # Wait for it to be ready
        while pinecone_client.describe_index(PINECONE_INDEX_NAME).status['ready'] is False:
            time.sleep(1)

    pinecone_index = pinecone_client.Index(PINECONE_INDEX_NAME)
    Thread(target=background_updater, daemon=True).start()

# --- API ENDPOINTS ---

@app.get("/health")
def health():
    return {"status": "healthy", "last_update": last_update_time}

@app.get("/search/")
def search(query: str = Query(..., description="Your search query"), k: int = 5):
    query_emb = embed_text(query)
    res = pinecone_index.query(vector=query_emb.tolist(), top_k=k, include_metadata=True)
    results = []
    for match in res["matches"]:
        meta = match.get("metadata", {})
        results.append({
            "symbol": meta.get("symbol"),
            "name": meta.get("name"),
            "industry": meta.get("industry"),
            "sector": meta.get("sector"),
            "country": meta.get("country"),
            "business_summary": meta.get("business_summary"),
            "score": match.get("score"),
        })
    return {"results": results}

@app.get("/tickers/")
def get_tickers():
    return {"tickers": list(ticker_cache.keys())}

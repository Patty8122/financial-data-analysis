from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List
import requests
import json
import yfinance as yf
from pinecone import Pinecone, ServerlessSpec
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv
import concurrent.futures

load_dotenv()

# --- CONFIGURATION ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV", "us-east-1")
INDEX_NAME = "stock-ticker"
TICKER_JSON_URL = "https://raw.githubusercontent.com/team-headstart/Financial-Analysis-and-Automation-with-LLMs/main/company_tickers.json"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize clients
pc = Pinecone(api_key=PINECONE_API_KEY)


embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
llm = ChatOpenAI(temperature=0, openai_api_key=OPENAI_API_KEY)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
app = FastAPI()

# ========= UTILITY FUNCTIONS =========
def get_company_tickers():
    response = requests.get(TICKER_JSON_URL)
    if response.status_code == 200:
        company_tickers = json.loads(response.content.decode('utf-8'))
        return [v['ticker'] for v in company_tickers.values()]
    else:
        print(f"Failed to download tickers. Status code: {response.status_code}")
        return []

def fetch_ticker_description(ticker: str) -> str:
    try:
        return yf.Ticker(ticker).info.get("longBusinessSummary", "")
    except Exception as e:
        print(f"Error fetching description for {ticker}: {e}")
        return ""

def upsert_to_pinecone(ticker: str, description: str):
    if not description:
        return 0
    docs = text_splitter.create_documents([description], metadatas=[{"source": ticker, "text": description}])
    vectorstore = PineconeVectorStore(
        index=index,
        embedding=embeddings,
        text_key="text"
    )
    vectorstore.add_documents(docs)
    return len(docs)

def get_vectorstore():
    return PineconeVectorStore(
        index=index,
        embedding=embeddings,
        text_key="text"
    )


def populate_pinecone():
    global index
    tickers = get_company_tickers()
    index = pc.Index(INDEX_NAME)


    count = 0
    batch_size = 50  # Process 50 tickers at a time
    for i in range(0, len(tickers), batch_size):
        batch = tickers[i:i + batch_size]
        for ticker in batch:
            desc = fetch_ticker_description(ticker)
            if desc:
                upsert_to_pinecone(ticker, desc)
                count += 1
                
def populate_pinecone_concurrent(batch_size=50, max_workers=10):
    global index
    index = pc.Index(INDEX_NAME)
    tickers = get_company_tickers()

    print(f"Total tickers to upload: {len(tickers)}")

    def process_batch(batch, batch_id):
        local_count = 0
        for ticker in batch:
            desc = fetch_ticker_description(ticker)
            if desc:
                upsert_to_pinecone(ticker, desc)
                local_count += 1
        print(f"[✓] Processed batch {batch_id} with {local_count} tickers")

    batches = [
        tickers[i:i + batch_size]
        for i in range(0, len(tickers), batch_size)
    ]

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_batch, batch, idx + 1)
            for idx, batch in enumerate(batches)
        ]
        concurrent.futures.wait(futures)

    print("✅ All ticker batches uploaded to Pinecone")

# ========= MODELS =========
class QueryModel(BaseModel):
    query: str

class TickerModel(BaseModel):
    ticker: str

# ========= ENDPOINTS =========
@app.on_event("startup")
def startup_event():
    # populate pinecone with ticker descriptions
    # use refresh endpoint to update pinecone
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,  # OpenAI embeddings dimension
            metric="cosine",
            spec= ServerlessSpec(
                cloud="aws",
                region=PINECONE_ENV
            )
        )
        populate_pinecone_concurrent()
    else:
        print(f"Index {INDEX_NAME} already exists")
        global index
        index = pc.Index(INDEX_NAME)


@app.post("/qna_search")
def qna_search(payload: QueryModel):
    try:
        vectorstore = get_vectorstore()
        chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
        result = chain.run(payload.query)
        return {"answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {e}")

@app.post("/text_search")
def text_search(payload: QueryModel):
    try:
        vectorstore = get_vectorstore()
        results = vectorstore.similarity_search(payload.query, k=5)
        return [
            {
                "ticker": result.metadata.get("source"),
                "description": result.page_content
            }
            for result in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {e}")

@app.post("/refresh")
def refresh():
    # create index if it doesn't exist
    try:
        if INDEX_NAME in pc.list_indexes().names():
            print(f"Index {INDEX_NAME} already exists")
            # delete index
            pc.delete_index(INDEX_NAME)
        pc.create_index(
            name=INDEX_NAME,
            dimension=1536,  # OpenAI embeddings dimension
            metric="cosine",
            spec= ServerlessSpec(
                cloud="aws",
                region=PINECONE_ENV
            )
        )
        populate_pinecone_concurrent()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh error: {e}")

@app.post("/add_ticker_to_db")
def add_ticker(payload: TickerModel):
    try:
        desc = fetch_ticker_description(payload.ticker)
        if not desc:
            raise HTTPException(status_code=404, detail="No description found.")
        chunks = upsert_to_pinecone(payload.ticker, desc)
        return {"ticker": payload.ticker, "chunks_indexed": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Add ticker error: {e}")

@app.get("/ticker_info/{ticker_name}")
def get_ticker_info(ticker_name: str):
    try:
        vectorstore = get_vectorstore()
        results = vectorstore.similarity_search(
            ticker_name,
            filter={"source": ticker_name},
            k=1
        )
        if not results:
            raise HTTPException(status_code=404, detail=f"No information found for ticker {ticker_name}")
        
        return {
            "ticker": ticker_name,
            "source": results[0].metadata.get("source"),
            "text": results[0].page_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticker info: {e}")

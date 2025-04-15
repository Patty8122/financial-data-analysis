from db import init_db, SessionLocal, Stock

def load_sample_data():
    init_db()
    db = SessionLocal()
    
    # Sample data
    stocks = [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "description": "Technology company that makes iPhones",
            "sector": "Technology",
            "market_cap": 3000000000000
        },
        {
            "symbol": "MSFT",
            "name": "Microsoft",
            "description": "Technology company that makes Windows",
            "sector": "Technology",
            "market_cap": 2800000000000
        }
    ]
    
    try:
        for stock_data in stocks:
            stock = Stock(**stock_data)
            db.add(stock)
        db.commit()
        print("Sample data loaded successfully!")
    except Exception as e:
        print(f"Error loading sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_sample_data()
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Stock(Base):
    __tablename__ = 'stocks'
    
    id = Column(Integer, primary_key=True)
    symbol = Column(String, unique=True)
    name = Column(String)
    description = Column(String)
    sector = Column(String)
    market_cap = Column(Float)

engine = create_engine('sqlite:///stocks.db')
SessionLocal = sessionmaker(bind=engine)

def init_db():
    Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
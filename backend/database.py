from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# caminho do banco SQLite
DATABASE_URL = "sqlite:///./sport-trade-analyser.db"

# engine de conexão
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# sessão do banco
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# classe base para os models
Base = declarative_base()


# dependency injection do FastAPI
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
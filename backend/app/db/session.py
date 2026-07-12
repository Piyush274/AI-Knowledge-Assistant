from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

engine=create_engine(DATABASE_URL)

sessionLocal=sessionmaker(
    autocommit=False, #Changes are not saved automatically.
    autoflush=False, #SQLAlchemy won't automatically push pending changes before queries.
    bind=engine #Attach this session factory to the engine.
    )

#Used to create your models.
Base=declarative_base()


#Db dependancy
def get_db():
    try:
        db=sessionLocal()
        yield db #Give the session to the API route, and when the route finishes, continue executing the code after yield
    finally:
        db.close()


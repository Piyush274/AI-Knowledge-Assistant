# Splitting text ensures relevant fragments are stored together with a semantic overlap (so context isn't lost at the boundaries).

# Smarter than simply cutting every 700 characters because it tries to preserve paragraphs and sentences.
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Creates one splitter object that can be reused for every document
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700, #700 characters
    chunk_overlap=120,
    separators=["\n\n", "\n", " ", ""], #Splits in order first paragraph then new line then space then empty string
)

def create_chunks(text: str) -> list[str]:
    return text_splitter.split_text(text)

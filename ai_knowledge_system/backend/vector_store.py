from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from document_loader import load_documents
from chunking import split_documents
import shutil

# Persist directory
PERSIST_DIR = "chroma_db"

# Cache embedding model globally to avoid reloading on every request
_embedding_cache = None

def _get_embedding():
    """Initialize embedding model once and cache it"""
    global _embedding_cache
    if _embedding_cache is None:
        _embedding_cache = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embedding_cache

def create_vector_store():
    # Clear existing database to avoid dimension mismatch
    shutil.rmtree(PERSIST_DIR, ignore_errors=True)

    embedding = _get_embedding()
    documents = load_documents()
    chunks = split_documents(documents)

    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=PERSIST_DIR
    )

    print(f"📄 Total chunks created: {len(chunks)}")

    for i, chunk in enumerate(chunks[:3]):
        print(f"\n🔹 Chunk {i}:\n{chunk.page_content[:200]}")

    return len(chunks)

def get_vector_store():
    embedding = _get_embedding()
    return Chroma(
        persist_directory=PERSIST_DIR,
        embedding_function=embedding
    )

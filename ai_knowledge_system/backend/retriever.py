from langchain_chroma import Chroma

from vector_store import get_vector_store
import os
print("RETRIEVER DB PATH:", os.path.abspath("chroma_db"))

vectorstore = get_vector_store()

def detect_module(query: str):
    q = query.lower()

    if "payment" in q or "payments" in q:
        return "payment"
    elif "cart" in q:
        return "cart"
    elif "order" in q:
        return "order"
    else:
        return None


def retrieve_docs(query: str):
    module = detect_module(query)

    # Step 1: Try module-based retrieval
    if module:
        docs_with_score = vectorstore.similarity_search_with_score(
            query,
            k=5,
            filter={"module": module}
        )
    else:
        docs_with_score = vectorstore.similarity_search_with_score(query, k=5)
    
    print("\n📊 Scores:")
    for doc, score in docs_with_score:
        print(score, "->", doc.metadata)

    # Step 2: Relaxed filtering
    filtered_docs = [doc for doc, score in docs_with_score if score < 1.5]

    # Step 3: Fallback if empty
    if not filtered_docs:
        print("⚠️ No docs after filtering, using fallback")
        filtered_docs = [doc for doc, _ in docs_with_score[:2]]

    return filtered_docs
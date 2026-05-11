from google import genai
import os
from fastapi import FastAPI
from pydantic import BaseModel
from graph_generator import generate_graph
from document_loader import load_documents
from chunking import split_documents
from fastapi.middleware.cors import CORSMiddleware
from rag_pipeline import generate_answer
from graph_api import router as graph_router
from graph_generator import generate_graph
from retriever import retrieve_docs
# Gemini Client
client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY")
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router)

class QueryRequest(BaseModel):
    query: str


@app.get("/")
def home():
    return {"message": "Backend running"}


@app.get("/load-docs")
def load_docs():
    docs = load_documents()
    chunks = split_documents(docs)
    return {
        "documents_loaded": len(docs),
        "chunks_created": len(chunks),
        "sample_chunk": chunks[0].page_content if chunks else "No data"
    }


# @app.post("/query")
# def query(req: QueryRequest):
#     return {
#         "answer": f"Mock response for: {req.query}",
#         "confidence": 0.9
#     }


@app.get("/create-db")
def create_db():
    from vector_store import create_vector_store
    chunks = create_vector_store()
    return {"message": f"Vector DB created with {chunks} chunks"}


@app.get("/search")
def search(query: str):
    from retriever import retrieve_docs
    results = retrieve_docs(query)
    return {
        "query": query,
        "results": results
    }

@app.post("/query")
def query_rag(req: dict):
    result = generate_answer(req["query"])

    return {
        "query": req["query"],
        "answer": result["answer"],
        "confidence": result["confidence"],
        "source_docs": result["source_docs"]
    }

@app.get("/graph")
def get_graph():

    docs = retrieve_docs(
        "system modules dependencies"
    )

    context = "\n\n".join([
        doc.page_content for doc in docs
    ])

    graph = generate_graph(context)

    print("\n Generated Graph:")
    print(graph)

    return graph

from fastapi import HTTPException
import os

@app.post("/impact-analysis")
async def impact_analysis(req: dict):
    # 1. Validation
    if "query" not in req:
        raise HTTPException(status_code=400, detail="Query is required")
    
    query = req["query"]

    # 2. Retrieval
    try:
        docs = retrieve_docs(query)
        context_text = "\n\n".join([
            d.page_content if hasattr(d, 'page_content') else str(d) 
            for d in docs
        ])
    except Exception as e:
        print(f"Retrieval Error: {e}")
        context_text = "No additional context found."

    # 3. Generation with Gemini 2.5 Flash
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=(
                "You are a Senior Architect AI. Your task is to perform a technical impact analysis. "
                "Use the provided context to identify dependencies. Be concise and professional.\n\n"
                f"Context:\n{context_text}\n\nAnalyze the impact of this change/failure: {query}"
            ),
            config={"temperature": 0.2}
        )

        # 4. Safe Text Access
        analysis_output = response.text

        if analysis_output:
            analysis_output = analysis_output.strip()
        else:
            analysis_output = "The model was unable to generate an analysis. Please check the query."

    except Exception as e:
        print(f" Gemini Impact Analysis Error: {str(e)}")
        if "429" in str(e):
            analysis_output = "Rate limit exceeded. Please wait a moment before trying again."
        elif "503" in str(e):
            analysis_output = "Server is busy. High demand detected."
        else:
            analysis_output = "An internal error occurred during analysis."

    return {
        "analysis": analysis_output,
        "source_docs_used": len(docs)
    }

@app.get("/generate-quiz")
def generate_quiz():

    docs = retrieve_docs(
        "payment cart order authentication"
    )

    context = "\n\n".join([
        d.page_content for d in docs
    ])

    prompt = f"""
    Generate 5 MCQ questions.

    Rules:
    - Based ONLY on context
    - Include 4 options
    - Mention correct answer
    - Cover different modules

    Return JSON format:

    [
      {{
        "question": "...",
        "options": ["A","B","C","D"],
        "answer": "A"
      }}
    ]

    Context:
    {context}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config={
            "system_instruction": "you are a Senior architect, with this role generate 5 simple trivia questions on the provided documents with Multi choice answers",
            "temperature": 0.2
        },
        contents=prompt
    )

    return response.text
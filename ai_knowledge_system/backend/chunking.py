from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=80
    )

    chunks = splitter.split_documents(documents)

    for chunk in chunks:
        if "module" not in chunk.metadata:
            chunk.metadata["module"] = "general"


    return chunks
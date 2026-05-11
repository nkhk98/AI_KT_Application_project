from langchain_community.document_loaders import TextLoader
import os

def load_documents():
    docs = []
    data_path = os.path.join(os.path.dirname(__file__), "data")

    for file in os.listdir(data_path):
        if file.endswith(".txt"):
            loader = TextLoader(os.path.join(data_path, file))
            docs.extend(loader.load())

    return docs
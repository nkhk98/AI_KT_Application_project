from langchain.schema import Document
from langchain_chroma import Chroma
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document
import os
print("INGEST DB PATH:", os.path.abspath("chroma_db"))
# 🔹 Step 1: Create embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2"
)

# 🔹 Step 2: Create documents (WITH metadata)
documents = [
    Document(
        page_content="""
    Payment Gateway Module:

    Overview:
    The payment system enables users to complete purchases securely using third-party gateways.

    Key Features:
    - Integration with Razorpay and Stripe
    - Secure checkout process
    - Handles both payment success and failure scenarios

    Flow:
    1. User proceeds to checkout
    2. System validates cart and authentication
    3. Payment request sent to gateway (Razorpay/Stripe)
    4. On success → order is created
    5. On failure → user is notified

    Dependencies:
    - Cart Management
    - User Authentication
    - Order Management
    """,
            metadata={"module": "payment"}
        ),

        Document(
            page_content="""
    Cart Management Module:

    Features:
    - Add/remove items
    - Update quantity
    - View total price

    Role:
    Acts as input for payment processing.
    """,
            metadata={"module": "cart"}
        ),

        Document(
            page_content="""
    Order Management Module:

    Features:
    - Place order
    - Track order status
    - View order history

    Dependency:
    Triggered only after successful payment.
    """,
            metadata={"module": "order"}
    )
]

# 🔥 Step 3: CREATE + STORE VECTOR DB (ADD HERE)
for i, doc in enumerate(documents):
    print(f"\n📄 Document {i}:\n{doc.page_content}\n")
vectorstore = Chroma.from_documents(
    documents,
    embedding=embeddings,
    persist_directory="chroma_db"
)

# 🔍 Optional debug
print("📦 DB count:", vectorstore._collection.count())
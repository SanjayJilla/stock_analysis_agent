from langchain_community.vectorstores import FAISS

from app.rag.embeddings import get_embeddings


def create_vectorstore(documents):

    embeddings = get_embeddings()
    vectorstore = FAISS.from_documents(
        documents,
        embeddings
    )

    return vectorstore
import os

from langchain_community.vectorstores import FAISS

from app.rag.embeddings import get_embeddings


def retrieve_company_information(
    ticker: str,
    query: str
):

    vectorstore_path = (
        f"data/vectorstores/{ticker.upper()}"
    )

    if not os.path.exists(vectorstore_path):

        return {
            "error": (
                f"No documents found for {ticker.upper()}"
            )
        }

    embeddings = get_embeddings()

    vectorstore = FAISS.load_local(
        vectorstore_path,
        embeddings,
        allow_dangerous_deserialization=True
    )

    documents = vectorstore.similarity_search(
        query,
        k=5
    )

    results = []

    for document in documents:

        results.append({
            "content": document.page_content,
            "metadata": document.metadata
        })

    return results
from app.rag.retriever import (
    retrieve_company_information
)


def rag_node(state):

    ticker = state["ticker"]

    query = state["query"]

    results = retrieve_company_information(
        ticker,
        query
    )

    if isinstance(results, dict):
        return {
            "rag_context": results
        }

    context = "\n\n".join(
        item["content"]
        for item in results
    )

    return {
        "rag_context": context
    }
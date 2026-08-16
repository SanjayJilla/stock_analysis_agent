from app.rag.retriever import (
    retrieve_company_information
)


def rag_node(state):
    ticker = state.get("ticker", "")
    query = state.get("query") or state.get("user_query", f"What are {ticker}'s major risks and financials?")

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
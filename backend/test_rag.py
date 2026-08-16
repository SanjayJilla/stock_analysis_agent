# from app.rag.retriever import retrieve_company_information


# results = retrieve_company_information(
#     "AAPL",
#     "What are Apple's major business risks?"
# )

# print("\n\n===== RESULTS =====\n")

# print(results)
from app.agent.nodes.rag import rag_node


state = {
    "ticker": "AAPL",
    "query": "What are Apple's major business risks?"
}


result = rag_node(state)

print("\n===== RAG CONTEXT =====\n")

print(result["rag_context"])
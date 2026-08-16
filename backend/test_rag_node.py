from app.agent.nodes.risk import risk_node


state = {
    "ticker": "AAPL",

    "financial_data": {
        "revenue": "test revenue",
        "profit": "test profit"
    },

    "technical_data": {
        "rsi": 60,
        "trend": "bullish"
    },

    "news_data": [
        {
            "title": "Apple announces new product"
        }
    ],

    "rag_context": """
    Apple's annual report mentions
    supply chain and competitive risks.
    """
}


result = risk_node(state)

print("\n===== RISK ANALYSIS =====\n")

print(result)
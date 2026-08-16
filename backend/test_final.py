from app.agent.nodes.final_analysis import final_analysis_node

state={
    "ticker":"AAPL",
    "user_query":"Analyze the financial health and major risks",
    "market_data":{
        "current_price":200,
        "volume":50000000,
        "pe_ratio":30
    },
    "financial_data": {
        "revenue": "High",
        "profit": "Strong",
        "debt": "Moderate"
    },
    "technical_data": {
        "rsi": 60,
        "trend": "Bullish"
    },

    "news_data": [
        {
            "title": "Apple announces new product"
        }
    ],

    "rag_context": """
    Apple's annual report identifies
    competition and supply-chain risks.
    """,

    "risks": """
    Main risks include competition,
    valuation and supply-chain exposure.
    """
}
result=final_analysis_node(state)
print("\n===== FINAL ANALYSIS =====\n")
print(result["final_analysis"])
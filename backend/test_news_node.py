from app.agent.nodes.news import news_node


state = {
    "ticker": "AAPL"
}


result = news_node(state)

print("\n===== NEWS =====\n")

print(result["news_data"])
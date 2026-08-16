from app.tools.technical import technical_analysis

def technical_node(state):
    ticker=state["ticker"]
    data=technical_analysis(ticker)
    return {
        "technical_data":data
    }



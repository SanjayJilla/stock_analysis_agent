from app.tools.financial_data import get_financial_metrics
def fundamental_node(state):
    ticker=state["ticker"]
    data=get_financial_metrics(ticker)
    return {
        "financial_data":data
    }











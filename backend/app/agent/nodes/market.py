from app.tools.market_data import get_stock_price

def market_node(state):
    ticker=state["ticker"]
    data=get_stock_price(ticker)
    return {
        "market_data":data
    }



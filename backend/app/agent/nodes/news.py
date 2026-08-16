from app.tools.news import get_stock_news   

def news_node(state):
    ticker=state["ticker"]
    news=get_stock_news(ticker)
    return {
        'news_data':news
    }

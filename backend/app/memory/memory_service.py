from app.memory.database import get_previous_analysis, save_analysis


def load_memory(ticker):
    """
    Loads previous analysis, price, and date from PostgreSQL for the given ticker.
    Returns empty placeholder values if no historical analysis exists.
    """
    previous = get_previous_analysis(ticker)

    if previous is None:
        return {
            "previous_analysis": "",
            "previous_price": None,
            "previous_date": ""
        }

    return {
        "previous_analysis": previous["analysis"],
        "previous_price": previous["current_price"],
        "previous_date": str(previous["created_at"])
    }



def save_memory(state):
    """
    Extracts the newly generated analysis, current stock price, ticker, and user query
    from the LangGraph state and saves it into the database for future comparison.
    """
    ticker = state.get("ticker")
    user_query = state.get("user_query", "")
    analysis = state.get("final_analysis", "")
    
    # Extract current stock price from market_data if available
    market_data = state.get("market_data", {})
    current_price = None
    if isinstance(market_data, dict):
        current_price = market_data.get("price")

    if ticker and analysis:
        save_analysis(
            ticker=ticker,
            user_query=user_query,
            analysis=analysis,
            current_price=current_price
        )
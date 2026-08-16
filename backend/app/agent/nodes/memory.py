from app.memory.memory_service import load_memory, save_memory


def memory_node(state):
    """
    Step 1: Runs at the start of the LangGraph flow.
    Loads previous analysis, historical price, and date from PostgreSQL
    so that downstream nodes (Risk and Final Analysis) can compare 'Now vs. Before'.
    """
    ticker = state["ticker"]
    memory_data = load_memory(ticker)
    
    return {
        "previous_analysis": memory_data.get("previous_analysis", ""),
        "previous_price": memory_data.get("previous_price"),
        "previous_date": memory_data.get("previous_date", "")
    }


def save_node(state):
    """
    Final Step: Runs after final_analysis_node.
    Persists the newly generated stock analysis into PostgreSQL for future comparisons.
    """
    save_memory(state)
    return {}

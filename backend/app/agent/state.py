from typing import Any, TypedDict

class AgentState(TypedDict):
    """
    A Typed dict contains the state of the agent.
    """
    user_query:str
    ticker:str
    query:str

    market_data:Any
    financial_data:Any
    technical_data:Any
    news_data:Any
    rag_context:str

    risks:Any
    previous_analysis: str
    previous_price: float
    previous_date: str
    
    # FIX: Added final_analysis to store the final generated report from final_analysis_node
    final_analysis: str

    financials:str






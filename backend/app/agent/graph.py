from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.agent.state import AgentState
from app.agent.nodes.memory import memory_node, save_node
from app.agent.nodes.fundamental import fundamental_node
from app.agent.nodes.market import market_node
from app.agent.nodes.technical import technical_node
from app.agent.nodes.news import news_node
from app.agent.nodes.rag import rag_node
from app.agent.nodes.risk import risk_node
from app.agent.nodes.final_analysis import final_analysis_node

def build_graph(checkpointer=None):
    """
    Constructs the LangGraph stock analysis workflow:
    1. START -> memory_node (loads previous analysis from PostgreSQL)
    2. memory_node -> [market, fundamental, technical, news, rag] (parallel data collection)
    3. Parallel branches -> risk_node (identifies risks & compares against history)
    4. risk_node -> final_analysis_node (synthesizes final investment report & historical shift)
    5. final_analysis_node -> save_node (persists new analysis to PostgreSQL for future runs)
    6. save_node -> END
    """
    graph = StateGraph(AgentState)
    
    # 1. Register all nodes
    graph.add_node("memory", memory_node)
    graph.add_node("market", market_node)
    graph.add_node("fundamental", fundamental_node)
    graph.add_node("technical", technical_node)
    graph.add_node("news", news_node)
    graph.add_node("rag", rag_node)
    graph.add_node("risk", risk_node)
    graph.add_node("final_analysis", final_analysis_node)
    graph.add_node("save", save_node)

    # 2. Flow from START to Memory loader
    graph.add_edge(START, "memory")

    # 3. Parallel execution of data gatherers after memory is loaded
    graph.add_edge("memory", "market")
    graph.add_edge("memory", "technical")
    graph.add_edge("memory", "fundamental")
    graph.add_edge("memory", "news")
    graph.add_edge("memory", "rag")
    
    # 4. Route all parallel data into Risk Analyst
    graph.add_edge("market", "risk")
    graph.add_edge("fundamental", "risk")
    graph.add_edge("technical", "risk")
    graph.add_edge("news", "risk")
    graph.add_edge("rag", "risk")
    
    # 5. Risk Analyst -> Final Report Synthesis -> Save to Database -> END
    graph.add_edge("risk", "final_analysis")
    graph.add_edge("final_analysis", "save")
    graph.add_edge("save", END)

    # 6. Compile with checkpointer (enables multi-turn conversational session memory via thread_id)
    if checkpointer is None:
        checkpointer = MemorySaver()

    return graph.compile(checkpointer=checkpointer)

# Default compiled agent instance with in-memory checkpointer
stock_agent = build_graph()

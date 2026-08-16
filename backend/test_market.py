from app.tools.market_data import get_stock_price
from app.tools.market_data import get_historical_data
result=get_historical_data("AAPL", "1y")
print(result)
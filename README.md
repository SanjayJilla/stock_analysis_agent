Autonomous Financial Intelligence & Stock Analysis Terminal

The system orchestrates an autonomous multi-agent workflow that aggregates live market data, calculates quantitative technical indicators, analyzes fundamental filings, evaluates breaking market news, and performs risk modeling with historical memory retention.This is helpful for stock market analysis.
 END

Prerequisites
- Python 3.10+
- PostgreSQL instance or Docker

1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your GOOGLE_API_KEY and DATABASE_URL

# Initialize Database Tables
python init_db.py

# Start Backend Server
uvicorn app.main:app --reload --port 8000
```

 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

The frontend terminal will run at `http://localhost:5173` and communicate with FastAPI at `http://localhost:8000`.

3. Docker Compose (Full Stack)

To run the complete stack including PostgreSQL in containers:

```bash
docker-compose up --build
```


# EarnSure — Full Stack Startup Guide

## Architecture
Frontend → Backend (Express) → MCP Server (stdio) → DB + AI Engine + OpenWeather API + Google Maps API

## Start order

### 1. Database (Docker)
```
docker compose up db
```

### 2. Seed DB (first time only)
```
cd database
node seed.js
```

### 3. MCP Server dependencies
```
cd mcp-server
npm install
```

### 4. AI Engine (Python)
```
cd ai-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

### 5. Backend (starts MCP server as child process)
```
cd backend
npm install
npm start
```

### 6. Frontend
```
cd frontend
npm install
npm run dev
```

## Docker Compose (All Services)
```
docker compose up --build
```

### Services
- **db**: PostgreSQL on port 5432
- **ai-engine**: Python AI service on port 8000
- **backend**: Node.js API on port 3000
- **mcp-server**: MCP tools server
- **frontend**: React frontend on port 5173

## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- AI Engine: http://localhost:8000
- Database: localhost:5432
- MCP: stdio (spawned by backend)

## Environment Variables Required
Create `.env` files with these variables:

### mcp-server/.env
```
NODE_ENV=development
DATABASE_URL=postgres://earnsure:earnsure_dev_password@localhost:5432/earnsure
LOG_LEVEL=info
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### backend/.env
```
NODE_ENV=development
DATABASE_URL=postgres://earnsure:earnsure_dev_password@localhost:5432/earnsure
JWT_SECRET=your_jwt_secret
MCP_SERVER_URL=http://localhost:3100
```

## MCP Tools
- **weather_tool** → OpenWeather API
- **risk_prediction_tool** → AI Engine /risk/predict
- **claim_tool** → PostgreSQL claims table
- **fraud_detection_tool** → PostgreSQL multi-table check
- **risk_pool_tool** → PostgreSQL pools table
- **payment_tool** → PostgreSQL transactions table
- **zone_recommendation_tool** → PostgreSQL zone_demand table
- **location_tool** → OpenStreetMap/Nominatim (FREE - no API key required!)

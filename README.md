# EarnSure — Income Protection for Food Delivery Riders

<p align="center">
  <img src="https://img.shields.io/badge/Stack-MERN%20%2B%20Python-orange" alt="Stack">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
</p>

EarnSure is a **parametric insurance platform** designed specifically for **food delivery riders** in India. It provides automatic income protection when weather disruptions, algorithm changes, or platform demand drops affect a rider's ability to earn.

---

## 📚 Table of Contents

1. [The Problem: Why EarnSure Exists](#the-problem-why-earnsure-exists)
2. [Market Context: The Gig Economy Crash](#market-context-the-gig-economy-crash)
3. [How It Works](#how-it-works)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Tech Stack](#tech-stack)
7. [Getting Started](#getting-started)
8. [API Endpoints](#api-endpoints)
9. [Database Schema](#database-schema)
10. [MCP Tools](#mcp-tools)
11. [Security](#security)
12. [Adversarial Defense & Anti-Spoofing Strategy](#adversarial-defense--anti-spoofing-strategy)
13. [Contributing](#contributing)

---

## 🚨 The Problem: Why EarnSure Exists

Food delivery gig workers in India face unpredictable income disruptions:

- **Weather disruptions**: Heavy rain, heatwaves, and AQI spikes make riding unsafe and reduce order volume
- **Algorithm downtime**: Platforms show riders as "online" but don't dispatch orders due to algorithmic throttling
- **Platform demand drops**: Weekend patterns, holidays, and market oversupply cause sudden earning drops
- **No traditional insurance**: Food delivery riders are classified as "self-employed" and excluded from employee benefits

Traditional insurance requires claim filing, documentation, and manual verification—processes that take weeks and often get rejected. Food delivery riders need **instant, automatic payouts** when disruptions occur.

---

## 📉 Market Context: The Gig Economy Crash

The Indian gig economy has experienced significant instability, leading to what many call a "market crash":

### 1. **Oversupply Crisis**
- Too many riders chasing too few orders
- Average earnings dropped 40-60% in major cities (2022-2024)
- Rider acceptance rates fell below 30% as survival became priority

### 2. **Platform Algorithm Changes**
- Unannounced changes to dispatch algorithms
- "Ghost orders" where riders appear online but receive no requests
- Deactivation risks for low-rated or low-acceptance drivers

### 3. **Weather & Climate Impact**
- Monsoon flooding in Bengaluru, Chennai, Hyderabad
- Heatwaves exceeding 45°C making delivery unsafe
- AQI spikes >200 in Delhi-NCR making outdoor work hazardous

### 4. **No Worker Protections**
- No sick leave, no health insurance, no provident fund for delivery riders
- Riders bear 100% of vehicle, fuel, and maintenance costs
- No income during illness, injury, or family emergencies

### 5. **The Solution: Parametric Insurance**
EarnSure addresses this market crash by providing:
- **Automatic trigger-based payouts** (no claims process)
- **Collective risk pooling** (community-based protection)
- **AI-powered fraud detection** (prevents abuse, keeps costs low)
- **Real-time risk monitoring** (weather, traffic, platform demand)

---

## ⚙️ How It Works

EarnSure is specifically designed for **food delivery riders** working on platforms like Swiggy, Zomato, Blinkit, and Zepto.

### 1. **Sign Up in 2 Minutes**
Link your Swiggy, Zomato, Blinkit, or Zepto rider account and choose a protection plan.

### 2. **Pay ₹25–50/week**
Premium is risk-based:
- **Low risk** (₹25/week): Part-time riders, good weather zones
- **Medium risk** (₹35/week): Full-time riders, moderate disruption zones
- **High risk** (₹50/week): High-disruption cities, lower acceptance rate

### 3. **AI Monitors 24/7**
For food delivery riders, the system continuously tracks:
- Weather conditions (rain, temperature, AQI) affecting delivery zones
- Platform demand patterns on Swiggy, Zomato, Blinkit, Zepto
- Traffic congestion levels in delivery areas
- Algorithm performance (when riders appear online but get no orders)

### 4. **Automatic Payouts**
When a trigger condition is met:
- Event detected → Claim created → Money in UPI within 2 hours
- Zero paperwork, zero waiting

---

## ✨ Features

### Core Insurance Features

| Feature | Description |
|---------|-------------|
| **Weather Disruption Cover** | Heavy rain (>20mm/3hrs), heatwave (>42°C), AQI spike (>200) trigger automatic payouts |
| **Algorithm Downtime Cover** | AI detects when you're online but receiving zero orders due to platform throttling |
| **Instant Parametric Payout** | Event detected → claim created → money in UPI within 2 hours |
| **Collective Risk Pool** | Food delivery riders contribute ₹25–50/week into a city-level pool; claims paid from pool transparently |

### AI & Intelligence Features

| Feature | Description |
|---------|-------------|
| **Smart Zone Suggestions** | AI recommends highest-earning delivery zones based on live demand and weather data |
| **AI Fraud Protection** | Every claim verified via duplicate detection, GPS check, and frequency analysis |
| **Risk Prediction** | ML model predicts weekly premium based on city, platform, and risk factors |
| **Income Stability Tracking** | 7-day income stability analysis per worker |

### Admin & Operations Features

| Feature | Description |
|---------|-------------|
| **Real-time Dashboard** | Portfolio health, claims movement, worker distribution |
| **Pool Management** | City-level pool balance, reserve fund, member tracking |
| **Trigger Monitoring** | Weather, traffic, platform demand, downtime event tracking |
| **Audit Logging** | Complete audit trail for all system actions |
| **Notification System** | SMS alerts for risk alerts, claims, payouts, fraud warnings |

### Financial Features

| Feature | Description |
|---------|-------------|
| **Premium Collection** | Weekly premium collection via policy_payments table |
| **Payout Processing** | UPI-based instant payouts via payment service |
| **Reinsurance Fund** | Catastrophic loss protection via reinsurance layer |
| **Pool Reserve Tracking** | Reserve fund management for sustainable pool operations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                              │
│    Worker Dashboard    │    Admin Console    │    Landing Page         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Backend Services (Express)                       │
│         /auth, /policies, /claims, /workers, /admin, /mcp               │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
         ┌────────────────┐ ┌──────────┐ ┌─────────────┐
         │  MCP Server    │ │ AI Engine │ │  PostgreSQL  │
         │  (Tool Layer)  │ │ (Python)  │ │  Database   │
         └────────────────┘ └──────────┘ └─────────────┘
                    │            │            │
         ┌─────────┼─────────┐  │      ┌─────┴─────┐
         ▼         ▼         ▼  ▼      ▼            ▼
   ┌──────────┐ ┌────────┐ ┌─────┐ ┌────────┐ ┌────────┐
   │ Weather  │ │ Risk   │ │Claim│ │ Pool   │ │ Payment│
   │ API      │ │ ML     │ │Tool│ │ Tool   │ │ Tool   │
   └──────────┘ └────────┘ └─────┘ └────────┘ └────────┘
```

### System Flow

1. **Trigger Detection**: MCP Server ingests external signals (weather, AQI, platform demand)
2. **Risk Evaluation**: AI Engine processes risk predictions and fraud scores
3. **Claim Generation**: Backend evaluates trigger conditions; if met, creates claim
4. **Payout Processing**: Payment service initiates UPI disbursement
5. **Notification**: Worker receives SMS notification of payout

### Service Components

| Service | Description | Port |
|---------|-------------|------|
| `backend` | Express.js REST API | 3000 |
| `backend-services` | Additional microservices | 3001 |
| `ai-engine` | FastAPI Python ML service | 8000 |
| `mcp-server` | Model Context Protocol tools | stdio |
| `frontend` | React Vite application | 5173 |
| `frontend-admin` | Admin dashboard | 5174 |
| `frontend-worker` | Worker portal | 5175 |

---

## 💻 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **CSS Modules** - Styling

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **OTP** - Phone verification

### AI & ML
- **Python** - ML runtime
- **FastAPI** - ML API framework
- **scikit-learn** - ML models
- **pandas** - Data processing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **OpenWeather API** - Weather data
- **Google Maps API** - Location services
- **OpenStreetMap/Nominatim** - Free geocoding

---

## 🚀 Getting Started

### Quick Start (All Services with Docker Compose)

The easiest way to run everything:

```bash
# Navigate to the project directory
cd earnsure

# Start all services (database, backend, frontend, AI engine)
docker compose up --build

# Access the application:
# ┌─────────────────────┬────────────────────┐
# │ Service             │ URL                │
# ├─────────────────────┼────────────────────┤
# │ Frontend (Worker)   │ http://localhost:5173  │
# │ Frontend (Admin)   │ http://localhost:5174  │
# │ Backend API         │ http://localhost:3000  │
# │ AI Engine          │ http://localhost:8000  │
# │ Database (PostgreSQL)│ localhost:5432     │
# └─────────────────────┴────────────────────┘
```

---

### Manual Setup (Step by Step)

If you prefer to run services individually:

#### Step 1: Start Database (Docker)
```bash
# Start PostgreSQL container
docker compose up db

# Seed the database (first time only)
cd database
node seed.js
```

#### Step 2: Start MCP Server
```bash
cd mcp-server
npm install
# Runs as stdio process spawned by backend
```

#### Step 3: Start AI Engine (Python)
```bash
cd ai-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8000
# Access: http://localhost:8000
```

#### Step 4: Start Backend (Node.js)
```bash
cd backend
npm install
npm start
# Access: http://localhost:3000
```

#### Step 5: Start Frontend (React)
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:5173
```

---

### Running Individual Services

```bash
# Only database
docker compose up db

# Database + Backend only
docker compose up db backend

# Frontend only (requires backend running)
cd frontend && npm run dev

# Admin Dashboard only
cd frontend-admin && npm run dev
```

### Environment Variables

Create `.env` files as specified in [STARTUP.md](STARTUP.md).

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with phone + OTP |
| POST | `/auth/register` | Register new user |
| POST | `/auth/otp/send` | Send OTP to phone |
| POST | `/auth/otp/verify` | Verify OTP |

### Workers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/worker/profile` | Get worker profile |
| PATCH | `/worker/profile` | Update worker profile |
| GET | `/worker/policy` | Get active policy |
| GET | `/worker/claims` | Get claim history |
| GET | `/worker/alerts` | Get risk alerts |
| GET | `/worker/zones` | Get recommended zones |
| GET | `/worker/notifications` | Get notifications |
| GET | `/worker/stability` | Get income stability |

### Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/policies` | Create new policy |
| GET | `/policies/:id` | Get policy details |
| PATCH | `/policies/:id` | Update policy |
| DELETE | `/policies/:id` | Cancel policy |

### Claims
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/claims` | File a claim |
| GET | `/claims` | List claims |
| GET | `/claims/:id` | Get claim details |
| PATCH | `/claims/:id/status` | Update claim status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/overview` | Dashboard overview |
| GET | `/admin/workers` | List all workers |
| GET | `/admin/claims` | List all claims |
| GET | `/admin/pools` | List all pools |
| GET | `/admin/alerts` | System alerts |
| POST | `/admin/payouts` | Process payouts |

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `workers` | Registered delivery workers |
| `policies` | Insurance policies |
| `claims` | Insurance claims |
| `risk_events` | Risk/trigger events |
| `transactions` | Financial transactions |
| `pools` | City-level risk pools |
| `pool_members` | Pool membership |
| `pool_transactions` | Pool financial movements |

### Activity Tables

| Table | Description |
|-------|-------------|
| `worker_activity` | Daily worker activity |
| `zone_demand` | Zone demand levels |
| `traffic_events` | Traffic congestion data |
| `platform_demand` | Platform order data |
| `algorithm_events` | Algorithm downtime events |

### Support Tables

| Table | Description |
|-------|-------------|
| `notifications` | Worker notifications |
| `policy_payments` | Premium payments |
| `audit_logs` | System audit trail |
| `reinsurance_fund` | Reinsurance reserves |
| `fraud_features` | Fraud detection features |

---

## 🔧 MCP Tools

The MCP (Model Context Protocol) server provides these tools:

| Tool | Description | External API |
|------|-------------|--------------|
| `weather_tool` | Get weather data | OpenWeather API |
| `risk_prediction_tool` | AI risk scoring | AI Engine |
| `claim_tool` | Create/manage claims | PostgreSQL |
| `fraud_detection_tool` | Fraud analysis | PostgreSQL |
| `risk_pool_tool` | Pool management | PostgreSQL |
| `payment_tool` | Process payments | PostgreSQL |
| `zone_recommendation_tool` | Zone suggestions | PostgreSQL |
| `location_tool` | Geocoding | OpenStreetMap |
| `algorithm_downtime_tool` | Detect algo issues | PostgreSQL |
| `income_stability_tool` | Income tracking | PostgreSQL |

---

## 🔒 Security

- **JWT Authentication** - Stateless auth with refresh tokens
- **OTP Verification** - Phone-based identity verification
- **Role-based Access** - Worker vs Admin roles
- **Audit Logging** - All actions tracked
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Parameterized queries
- **Rate Limiting** - API rate limiting

---

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

> ⚠️ **URGENT MARKET THREAT**: A sophisticated syndicate of 500 delivery workers has exploited GPS spoofing to fake their locations in severe weather zones and drain liquidity pools. This section addresses how EarnSure defends against such coordinated fraud attacks.

### The Threat

Organized fraud rings using Telegram groups are deploying GPS-spoofing apps to:
- Fake location in severe red-alert weather zones while resting at home
- Trigger false weather-based payouts en masse
- Drain city-level liquidity pools in coordinated attacks

### 1. Differentiation: AI/ML Architecture

Our system uses **multi-signal verification** to differentiate genuine stranded riders from spoofing attacks:

| Signal | What It Detects | Anti-Spoof Mechanism |
|--------|-----------------|----------------------|
| **GPS Trajectory Analysis** | Movement patterns over time | Detects impossible travel speeds; stationary location with no movement history = suspicious |
| **Platform Order History** | Actual delivery activity | Spoofed location = no real orders; genuine disruption = order drop after location entry |
| **Device Fingerprinting** | Phone characteristics | Detects known spoofing apps, emulator environments, root/jailbreak indicators |
| **Network Behavior** | IP address, cell tower triangulation | Detects VPN usage, mismatched IP-geo vs GPS location |
| **Behavioral Biometrics** | Touch patterns, app usage | Human vs bot/automation patterns |

### 2. The Data: Beyond Basic GPS

Our fraud detection analyzes **50+ data points** per claim:

```
Location Signals:
├── GPS coordinates (raw + corrected)
├── WiFi SSID / BSSID
├── Cell tower IDs
├── IP address + ASN
└── Address verification (geocoded)

Platform Signals:
├── Order acceptance rate (before vs during event)
├── Last 10 delivery locations
├── Session duration
├── App interaction patterns
└── Bank account verification

Environmental Signals:
├── Device battery level
├── Sensor data (barometer for indoor vs outdoor)
├── Bluetooth beacons nearby
├── Ambient light levels
└── Motion sensor data

Social Network Signals (aggregated):
├── Device proximity graph (are many " claimants" near each other?)
├── Communication patterns (Telegram group detection)
└── Common payment destinations
```

### 3. The UX Balance: Fair Claim Handling

We balance fraud prevention with legitimate worker experience:

#### Tiered Claim Processing

| Claim Type | Processing Time | Verification Level |
|------------|-----------------|---------------------|
| **Green (low risk)** | Instant auto-pay | Light verification |
| **Yellow (flagged)** | 2-4 hour review | Multi-signal check |
| **Red (suspicious)** | 24-48 hour hold | Full investigation + human review |

#### Fairness Principles

1. **No Account Freeze for Flagged Claims**
   - Riders can continue accepting orders during review
   - No penalty for being flagged (false positives happen)

2. **Graceful Degradation**
   - Network drops in severe weather are common
   - If GPS signal lost + weather alert = assume genuine
   - "Trust but verify" philosophy

3. **Appeal Process**
   - Human review for rejected claims
   - Clear rejection reasons with evidence
   - Easy resubmission with additional verification

4. **Transparent Scoring**
   - Workers can see their "trust score"
   - Good behavior over time increases auto-approval limits
   - Educational tips to avoid false flags

#### Syndicate Detection

Our system specifically detects **coordinated attacks**:

```
Anomaly Detection:
├── Geographic clustering (are 500+ claims from same zone?)
├── Temporal clustering (did claims spike within 30 minutes?)
├── Device similarity (same device fingerprint?)
├── Payment destination (same bank account?)
└── Social graph (communicating via same channel?)

Response Protocol:
1. Auto-pause pool withdrawals when cluster detected
2. Require secondary verification for all cluster members
3. Gradual release only after individual verification
4. Permanent ban for confirmed syndicate members
5. Legal referral for major fraud rings
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Guidewire DEVTrails 2026
- OpenWeather API for weather data
- OpenStreetMap for geocoding
- All gig workers who inspire this project
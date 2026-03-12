# GLIVE API - Betting & Odds Engine 🚀

A high-performance real-time betting API engine built with **Node.js, Express, Socket.io, and MongoDB**. Designed for 24/7 reliability, smart throttling, and sub-second data freshness.

---

## 🛠 Deployment Guide (Server Par Kaise Lagayein)

Follow these steps to deploy on your server (Ubuntu/Linux recommended):

### 1. Prerequisites
*   **Node.js:** v16 or higher
*   **MongoDB:** Local instance or MongoDB Atlas URI
*   **PM2:** For 24/7 uptime (`npm install -g pm2`)

### 2. Setup Environment Variables
Create a `.env` file in the root directory and add your credentials:
```env
PORT=4000
MONGO_URI=your_mongodb_atlas_uri
ACCOUNT_ID=your_sky_account_id
PASSWORD=your_sky_password
COUNTRY_CODE=IN
```

### 3. Installation
```bash
git clone <your-repo-url>
cd 9wicketapi
npm install
```

### 4. Running the Server
**Development Mode:**
```bash
npm start
```
**Production Mode (Recommended):**
```bash
pm2 start server.js --name "glive-api"
pm2 save
pm2 startup
```

---

## 📡 API Documentation (Sari APIs ki List)

### 1. Event Lists (Matches ki List)
| Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Inplay Count** | `GET` | `/api/v1/inplay/count` | Total Live matches count. |
| **Inplay Events** | `GET` | `/api/v1/inplay/events` | List of all ongoing matches. |
| **Today Events** | `GET` | `/api/v1/today/events` | Matches scheduled for today. |
| **Tomorrow Events** | `GET` | `/api/v1/tomorrow/events` | Matches scheduled for tomorrow. |
| **Sport Wise** | `GET` | `/api/v1/events/list/:sportId` | Matches for specific sport (4=Cricket, 1=Soccer, etc.) |

### 2. Live Odds (REST APIs)
| Name | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Sportsbook** | `GET` | `/api/v1/odds/sportsbook/:eventId` | Main match odds (Win/Loss). |
| **Fancy/Session** | `GET` | `/api/v1/odds/fancy/:eventId` | Session runs markets (Over-wise). |
| **Bookmaker** | `GET` | `/api/v1/odds/bookmaker/:eventId` | Local Bookmaker markets. |
| **Full Markets** | `GET` | `/api/v1/odds/full/:eventId` | Betfair/Exchange markets list. |
| **Betfair Odds** | `GET` | `/api/v1/odds/full/:eventId?marketId=1.23` | Specific Betfair market rates. |
| **Market List** | `GET` | `/api/v1/event/markets/:sportId/:eventId` | Discover available markets for a match. |

### 3. Real-Time Delivery (Socket.io)
**Connection:** `ws://your-domain:4000`

*   **Logic:** Room-based real-time push. Server background polling starts only when a user joins a room.
*   **Events:**
    *   `emit('joinMatch', eventId)`: Match view shuru karein.
    *   `emit('leaveMatch', eventId)`: Match view khatam karein.
    *   `on('oddsUpdate', payload)`: Merged real-time rates (Sportsbook + Fancy + Bookmaker + Full).

---

## 🔌 Debugging & Tools
*   **Socket Test Page:** `http://localhost:4000/test-socket` (Live rates testing tool)
*   **Stream Generator:** `http://localhost:4000/test` (Embed generator)
*   **Health Status:** `http://localhost:4000/debug/status` (Cookie/Token status)

---

## ⚡ 20-Year Exp Performance Optimization
*   **Delta-Sync:** Sirf wo events sync hote hain jo change huay hain.
*   **Smart Throttling:** Multi-user environment mein provider ko sirf 1 request jati hai per match.
*   **Memory-First:** Aggressive RAM caching for 0-ms latency.
*   **Auto-Maintenance:** Session cookies aur tokens background cron jobs se renew hote rehte hain.

---
Developed with ❤️ for 9Wicket.

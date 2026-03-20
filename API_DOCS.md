# 9Wicket API Documentation - A to Z List

This document provides a comprehensive list of all API endpoints available in the **9wicketapi** project, categorized by their respective providers and functionality.

---

## 🔹 1. SkyExchange APIs
These APIs interact with SkyExchange data, including live streams, event lists, and odds.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/glivestreaming/v1/glive/:matchId` | Fetches the streaming URL for a specific match. |
| **GET** | `/glivestreaming/v1/event/:eventId` | Returns the event stream data for a given event ID. |
| **GET** | `/api/v1/inplay/count` | Gets a fast-cached count of all live (in-play) events. |
| **GET** | `/api/v1/inplay/events` | Returns a list of current in-play events using delta-sync logic. |
| **GET** | `/api/v1/today/events` | Fetches all matches scheduled for today from the cache. |
| **GET** | `/api/v1/tomorrow/events` | Fetches all matches scheduled for tomorrow from the cache. |
| **GET** | `/api/v1/events/list/:sportId` | Dynamic list of events filtered by Sport ID (e.g., 4 = Cricket). |
| **GET** | `/api/v1/odds/sportsbook/:eventId` | Returns live Sportsbook odds for a specific event. |
| **GET** | `/api/v1/odds/fancy/:eventId` | Returns live Fancy (Session) odds for a specific event. |
| **GET** | `/api/v1/odds/bookmaker/:eventId` | Returns live Bookmaker odds for a specific event. |
| **GET** | `/api/v1/odds/full/:eventId?marketId=xxx` | Returns full market (Betfair) odds. **Requires `?marketId=xxx` query parameter.** |
| **GET** | `/api/v1/event/markets/:sportId/:eventId` | Fetches the market list (Other Menu) for a specific match. |

---

## 🔹 2. SportRadar APIs
These APIs handle SportRadar token management and specific market results.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/auth/sportradar/refresh` | Manually forces a refresh of the SportRadar authentication token. |
| **GET** | `/api/v1/auth/sportradar/token` | Returns the current active SportRadar token stored in the database. |
| **GET** | `/api/v1/odds/sportradermarkets/result/:sportId/:eventId` | Fetches individual market results from SportRadar. |
| **GET** | `/api/v1/odds/sportradermarkets/accordingbetfair/:sportId/:eventId` | Fetches full Betfair markets directly via SportRadar API with caching and token fallback. |
| **GET** | `/api/v1/odds/sportradermarkets/core/:sportId/:eventId` | Fetches core markets directly via SportRadar API (`api/v2/core/getmarkets`) with caching and fallback. |

---

## 🔹 3. the100exch APIs
These APIs pull specific odds and markets data from the the100exch provider.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/odds/t10/fancymarkets/:eventId` | Fetches fancy markets from t10 using 1-second in-memory caching and concurrency locks. |
| **GET** | `/api/v1/odds/t10/fancymarketsresult/:eventId` | Fetches fancy market results from t10 (`getFancyRunners`) using 1-second caching. |

---

## 🔹 4. Betfair Market APIs (UK Proxy)
These APIs use an active background polling proxy over the Betfair UK servers for resilient, high-speed cached data and auto-managed storage.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/odds/betfair/marketsresult?marketIds=1.23,1.24` | Fetches parsed Betfair market results from the DB/Proxy, dynamically adding sportName and handling closed status with a <10ms latency. |

---

## 🔹 5. KingExchange APIs
These APIs pull static and live data from the KingExchange provider.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/kx/sports` | Fetches the static sports list with 100% RAM + MongoDB caching. |
| **GET** | `/api/v1/kx/events` | High-speed list of all events (grouped by sport) with 0ms RAM caching. |
| **GET** | `/api/v1/kx/results/:eventId` | Fetches market results for a specific event with 24-hour persistence and 0ms RAM caching. |

---

## 🔹 6. Gman APIs (In-Play Proxy)
These APIs proxy live in-play event data from the Gman provider.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/events/gman/inplay` | Fetches live in-play matches from Gman with 10-second in-memory caching. |
| **GET** | `/api/v1/events/gman/sports` | Fetches the complete sports list from Gman using high-performance RAM caching. |
| **GET** | `/api/v1/events/gman/list/:sportId` | Dynamic list of events filtered by Sport ID (e.g., 4 = Cricket). |
| **GET** | `/api/v1/events/gman/details/:matchId` | Real-time match details and odds using 2-second On-Demand Polling. |

---

## 🔹 6. Internal & Debug APIs
Utility endpoints used for system health checks, testing, and debugging.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Basic health check; confirms the server is running. |
| **GET** | `/test-socket` | serves a test page to verify WebSocket connections. |
| **GET** | `/test` | serves the GLive Embed Generator/Tester tool. |
| **GET** | `/debug/status` | Returns the status of session cookies and auth tokens. |
| **GET** | `/debug/events` | Provides a summary of events in the database and the latest sync time. |

---

## 🔹 6. WebSocket (Socket.IO)
Real-time data streaming for high-velocity updates.

- **Path**: `/socket.io`
- **Purpose**: Primarily used for live odds updates via `odds.socket.js`.

---

**Note**: All API requests are protected by rate-limiting (300 requests per 15 mins per IP) and security headers (Helmet) to ensure system stability.

const { fetchSportsbookOdds } = require("../services/skyexchange/sportsbook.service");
const { fetchFancyOdds } = require("../services/skyexchange/fancyOdds.service");
const { fetchBookmakerOdds } = require("../services/skyexchange/bookmakerOdds.service");
const { fetchFullMarkets } = require("../services/skyexchange/fullMarkets.service");
const { fetchSportRadarOdds } = require("../services/sportradar/sportRadarMarketsResult.service");

let io;
const activeRooms = new Map(); // Store interval timers for each active match room

/**
 * Initialize Socket.io and setup event handlers.
 */
function initOddsSocket(socketIoInstance) {
    io = socketIoInstance;

    io.on("connection", (socket) => {
        console.log(`🔌 New Client Connected: ${socket.id}`);

        // 1. Join Match Room
        socket.on("joinMatch", (eventId) => {
            if (!eventId) return;

            socket.join(String(eventId));
            console.log(`👤 Client ${socket.id} joined match: ${eventId}`);

            // Start polling if not already active for this room
            startRoomPolling(eventId);
        });

        // 2. Leave Match Room
        socket.on("leaveMatch", (eventId) => {
            if (!eventId) return;

            socket.leave(String(eventId));
            console.log(`👤 Client ${socket.id} left match: ${eventId}`);

            // Optional: Stop polling if room is empty
            checkAndStopRoomPolling(eventId);
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Client Disconnected: ${socket.id}`);
        });
    });
}

/**
 * Higher-level broadcaster that sends updates only to interested clients.
 */
function startRoomPolling(eventId) {
    if (activeRooms.has(eventId)) return;

    console.log(`🚀 Starting Live Polling for Match: ${eventId}`);

    const interval = setInterval(async () => {
        const clients = io.sockets.adapter.rooms.get(String(eventId));
        const clientCount = clients ? clients.size : 0;

        console.log(`🕒 Polling Match ${eventId} | Active Viewers: ${clientCount}`);

        if (clientCount === 0) {
            console.log(`⚠️ No active viewers in room ${eventId}, stopping interval.`);
            checkAndStopRoomPolling(eventId);
            return;
        }

        const [sportsbookData, fancyData, bookmakerData, fullMarketsData, radarData] = await Promise.all([
            fetchSportsbookOdds(eventId),
            fetchFancyOdds(eventId),
            fetchBookmakerOdds(eventId),
            fetchFullMarkets(eventId),
            fetchSportRadarOdds("21", eventId) // Example sportId for now
        ]);

        if (sportsbookData || fancyData || bookmakerData || fullMarketsData || radarData) {
            console.log(`📤 Sending Merged Odds Update for ${eventId} to ${clientCount} clients.`);
            io.to(String(eventId)).emit("oddsUpdate", {
                eventId: eventId,
                timestamp: Date.now(),
                sportsbook: sportsbookData,
                fancy: fancyData,
                bookmaker: bookmakerData,
                fullMarkets: fullMarketsData,
                sportRadar: radarData
            });
        }
    }, 1500); // 1.5 second refresh for smooth blink effect

    activeRooms.set(eventId, interval);
}

function checkAndStopRoomPolling(eventId) {
    const clients = io.sockets.adapter.rooms.get(String(eventId));
    if (!clients || clients.size === 0) {
        const interval = activeRooms.get(eventId);
        if (interval) {
            clearInterval(interval);
            activeRooms.delete(eventId);
            console.log(`🛑 Stopped Polling for Match: ${eventId} (No active viewers)`);
        }
    }
}

module.exports = { initOddsSocket };

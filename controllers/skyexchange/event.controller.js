const Event = require("../../models/Event");
const { fetchStream } = require("../../services/skyexchange/stream.service");

async function getEventStream(req, res) {
    try {
        const { eventId } = req.params;

        // 1. Find Event in DB
        const event = await Event.findOne({ eventId });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // 2. Extract Streaming Channel
        const streamingChannel = event.rawData?.streamingChannel;
        let streamUrl = event.streamUrl;

        console.log(`[EVENT_HIT] User requested stream for: ${event.name} (ID: ${eventId}, Channel: ${streamingChannel})`);

        // 3. ON-DEMAND FETCH: Fetch fresh URL every time if streamingChannel is valid
        if (streamingChannel && streamingChannel !== "0") {
            console.log(`🎥 [FETCH_START] Fetching fresh stream for ${event.name} (${streamingChannel})...`);

            try {
                const streamData = await fetchStream(streamingChannel);
                if (streamData && streamData.streamingUrl) {
                    streamUrl = streamData.streamingUrl;

                    // ⚡ UPDATE DB (Always update with fresh link)
                    await Event.updateOne(
                        { eventId },
                        {
                            $set: {
                                streamUrl: streamUrl,
                                updatedAt: new Date()
                            }
                        }
                    );
                    console.log(`✅ [FETCH_SUCCESS] Stream URL found: ${streamUrl}`);
                } else {
                    console.log(`⚠️ [FETCH_EMPTY] API returned success but no URL for channel: ${streamingChannel}`);
                }
            } catch (err) {
                console.log(`❌ [FETCH_ERROR] Failed for ${event.name}: ${err.message}`);
                // Fallback to old streamUrl if fetch fails
            }
        } else if (streamingChannel === "0") {
            console.log(`🚫 [FETCH_SKIP] Channel is "0" for ${event.name} - No streaming available.`);
        }

        // 4. Return JSON
        res.json({
            success: true,
            data: {
                eventId: event.eventId,
                name: event.name,
                eventType: event.eventType,
                score: event.rawData?.scores,
                streamingChannel: streamingChannel,
                streamUrl: streamUrl,

            }
        });

    } catch (e) {
        console.log("❌ EVENT API ERROR:", e.message);
        res.status(500).json({ success: false, error: e.message });
    }
}

module.exports = { getEventStream };

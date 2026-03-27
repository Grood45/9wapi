const StreamingMap = require("../../models/StreamingMap");

/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Branded Delivery: Render original 3rd party scores in our own domain wrapper.
 * 2. Privacy-First: Hide original provider URLs from the end-user's browser.
 * 3. Zero-Restrition: No domain whitelisting (BYPASS) for score widgets.
 */

async function renderScoreEmbed(req, res) {
    const { eventId } = req.params;
    try {
        const mapping = await StreamingMap.findOne({ betfairId: eventId }).lean();
        if (!mapping || !mapping.scoreUrl) {
            return res.status(404).send("<h1>Score not available for this event yet.</h1>");
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Live Score Tracker [PRO]</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #000; overflow: hidden; }
                    iframe { border: none; height: 100%; width: 100%; background: #fff; }
                </style>
            </head>
            <body>
                <iframe src="${mapping.scoreUrl}" allowfullscreen="true"></iframe>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send(`Error: ${e.message}`);
    }
}

async function renderScoreV2Embed(req, res) {
    const { eventId } = req.params;
    try {
        const mapping = await StreamingMap.findOne({ betfairId: eventId }).lean();
        if (!mapping || !mapping.scoreUrlV2) {
            return res.status(404).send("<h1>Score V2 not available for this event yet.</h1>");
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Live Score Tracker V2 [PRO]</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #000; overflow: hidden; }
                    iframe { border: none; height: 100%; width: 100%; background: #fff; }
                </style>
            </head>
            <body>
                <iframe src="${mapping.scoreUrlV2}" allowfullscreen="true"></iframe>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(500).send(`Error: ${e.message}`);
    }
}

module.exports = { renderScoreEmbed, renderScoreV2Embed };

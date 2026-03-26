export const PROVIDER_ENDPOINTS = {
    'SportRadar': [
        { id: '/api/v1/auth/sportradar/refresh', pathTemplate: '/api/v1/auth/sportradar/refresh', label: 'SportRadar: Refresh Token', description: 'Triggers a manual refresh of the SportRadar authentication token.' },
        { id: '/api/v1/auth/sportradar/token', pathTemplate: '/api/v1/auth/sportradar/token', label: 'SportRadar: Get Token', description: 'Returns the active SportRadar token currently in use by the gateway.' },
        { id: '/api/v1/odds/sportradermarkets/result', pathTemplate: '/api/v1/odds/sportradermarkets/result/:sportId/:eventId', label: 'SportRadar: Individual Markets (:sportId/:eventId)', description: 'Returns live individual market results from SportRadar. Requires SportRadar specific :sportId (e.g. 4) and :eventId.' },
        { id: '/api/v1/odds/sportradermarkets/accordingbetfair', pathTemplate: '/api/v1/odds/sportradermarkets/accordingbetfair/:sportId/:eventId', label: 'SportRadar: Betfair-Style Markets (:sportId/:eventId)', description: 'Returns SportRadar markets mapped to Betfair structure. Requires SportRadar :sportId and :eventId.' },
        { id: '/api/v1/odds/sportradermarkets/core', pathTemplate: '/api/v1/odds/sportradermarkets/core/:sportId/:eventId', label: 'SportRadar: Core Markets (:sportId/:eventId)', description: 'Returns primary core betting markets from SportRadar. Requires SportRadar :sportId and :eventId.' }
    ],
    'Betfair': [
        { id: '/api/v1/odds/betfair/marketsresult', pathTemplate: '/api/v1/odds/betfair/marketsresult', label: 'Betfair: Markets Result (Bulk)', description: 'High-speed Betfair market results. You can pass multiple market IDs separated by commas in the marketIds query parameter (e.g., ?marketIds=1.213,1.214).' }
    ],
    'SkyExchange': [
        { id: '/glivestreaming/v1/glive', pathTemplate: '/glivestreaming/v1/glive/:matchId', label: 'GLive Streaming (Match ID)', description: 'SkyExchange streaming service. Use :matchId from the event list.' },
        { id: '/glivestreaming/v1/event', pathTemplate: '/glivestreaming/v1/event/:eventId', label: 'GLive Streaming (Event ID)', description: 'SkyExchange real-time event stream. Use :eventId from the provider.' },
        { id: '/api/v1/inplay/count', pathTemplate: '/api/v1/inplay/count', label: 'Sky: Inplay Count', description: 'Fast cached count of all live in-play sports events.' },
        { id: '/api/v1/inplay/events', pathTemplate: '/api/v1/inplay/events', label: 'Sky: Inplay Events Delta', description: 'Delta-sync endpoint for obtaining live in-play event updates.' },
        { id: '/api/v1/today/events', pathTemplate: '/api/v1/today/events', label: 'Sky: Today Events Delta', description: 'Delta-sync endpoint for all events scheduled for today.' },
        { id: '/api/v1/tomorrow/events', pathTemplate: '/api/v1/tomorrow/events', label: 'Sky: Tomorrow Events Delta', description: 'Delta-sync endpoint for all events scheduled for tomorrow.' },
        { id: '/api/v1/events/list', pathTemplate: '/api/v1/events/list/:sportId', label: 'Sky: Sport-wise List (:sportId)', description: 'Dynamic list of events filtered by :sportId (4=Cricket, 1=Soccer, 2=Tennis).' },
        { id: '/api/v1/odds/sportsbook', pathTemplate: '/api/v1/odds/sportsbook/:eventId', label: 'Sky: Sportsbook Odds (:eventId)', description: 'Live sportsbook odds. Requires :eventId.' },
        { id: '/api/v1/odds/fancy', pathTemplate: '/api/v1/odds/fancy/:eventId', label: 'Sky: Fancy/Session Odds (:eventId)', description: 'Real-time fancy/session odds for specific :eventId.' },
        { id: '/api/v1/odds/bookmaker', pathTemplate: '/api/v1/odds/bookmaker/:eventId', label: 'Sky: Bookmaker Odds (:eventId)', description: 'Live Bookmaker style odds. Requires :eventId.' },
        { id: '/api/v1/odds/full', pathTemplate: '/api/v1/odds/full/:eventId', label: 'Sky: Full Betfair Odds (:eventId)', description: 'Comprehensive market odds including full depth. Requires :eventId.' },
        { id: '/api/v1/event/markets', pathTemplate: '/api/v1/event/markets/:sportId/:eventId', label: 'Sky: Market Menu (:sportId/:eventId)', description: 'Retrieves available markets. Requires :sportId and :eventId.' }
    ],
    'The100exch': [
        { id: '/api/v1/odds/t10/fancymarkets', pathTemplate: '/api/v1/odds/t10/fancymarkets/:eventId', label: 'T10: Fancy Markets (:eventId)', description: 'T10 exchange specific fancy markets. Requires :eventId.' },
        { id: '/api/v1/odds/t10/fancymarketsresult', pathTemplate: '/api/v1/odds/t10/fancymarketsresult/:eventId', label: 'T10: Fancy Results (:eventId)', description: 'Historical and live results for T10 Fancy. Requires :eventId.' }
    ],
    'KingExchange': [
        { id: '/api/v1/kx/sports', pathTemplate: '/api/v1/kx/sports', label: 'KX: Sports List (Static Cache)', description: 'Returns the cached KingExchange sports list with ultra-low latency.' },
        { id: '/api/v1/kx/events', pathTemplate: '/api/v1/kx/events', label: 'KX: All Events List', description: 'Real-time list of all KingExchange events grouped by sport.' },
        { id: '/api/v1/kx/results', pathTemplate: '/api/v1/kx/results/:eventId', label: 'KX: Market Results (:eventId)', description: 'High-speed market results for a specific event ID.' }
    ],
    'Gman': [
        { id: '/api/v1/events/gman/inplay', pathTemplate: '/api/v1/events/gman/inplay', label: 'Gman: In-Play Events', description: 'Proxies live in-play event data from the Gman provider with 10-second caching.' },
        { id: '/api/v1/events/gman/sports', pathTemplate: '/api/v1/events/gman/sports', label: 'Gman: Sports List', description: 'Proxies the complete sports list from the Gman provider with background RAM caching.' },
        { id: '/api/v1/events/gman/list', pathTemplate: '/api/v1/events/gman/list/:sportId', label: 'Gman: Sport-wise List (:sportId)', description: 'Fetches matches for a specific Sport ID (e.g. 4 for Cricket) with zero-latency discovery-based RAM caching.' },
        { id: '/api/v1/events/gman/details', pathTemplate: '/api/v1/events/gman/details/:matchId', label: 'Gman: Match Details (Odds)', description: 'Real-time Match Odds, Bookmaker, and Fancy markets. Uses Specialist-Level On-Demand Polling (2s refreshing) for extreme performance.' }
    ],
    'D247': [
        { id: '/api/v1/stream/magic', pathTemplate: '/api/v1/stream/magic/:eventId', label: 'Magic Stream API (Unified ID)', description: 'High-precision unified streaming API that supports both Diamond and Betfair event IDs.' },
        { id: '/api/v1/stream/diamondtv', pathTemplate: '/api/v1/stream/diamondtv/:eventId', label: 'DiamondTV: JSON API (Get Stream URL)', description: 'Fetches the clean proxy iframe URL for DiamondTV streaming.' },
        { id: '/streming/diomondtv', pathTemplate: '/streming/diomondtv/:eventId', label: 'DiamondTV: Stream Playback (Iframe)', description: 'Renders the actual live stream player proxy.' },
        { id: '/api/v1/stream/d267tv', pathTemplate: '/api/v1/stream/d267tv/:eventId', label: 'D267TV: JSON API (Get Stream URL)', description: 'Fetches the clean proxy iframe URL for D267TV streaming.' },
        { id: '/streming/d267tv', pathTemplate: '/streming/d267tv/:eventId', label: 'D267TV: Stream Playback (Iframe)', description: 'Renders the actual live stream player proxy for D267TV.' }
    ]
};

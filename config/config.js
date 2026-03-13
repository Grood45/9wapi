module.exports = {
  PORT: 4000, // ✅ VPS ke liye BEST (3000 busy hota hai)

  LOGIN_URL: "https://api.gugobet.net/api/v1/member/login",

  GAME_API:
    "https://api.gugobet.net/api/v2/game/getGameUrl?game_code=4%40sport&platform_name=ninew3&mobile=1&category=sports&icon_key=1973",

  STREAM_API:
    "https://bkqawscf.gu21go76.xyz/exchange/member/playerService/getStreamingUrl",

  AUTH: {
    account_id: "9286732850",
    password: "Sher@123",
    country_code: "91",
  },

  MONEYBUZZ: {
    domain: "moneybuzz247.com",
    username: "sher2323",
    password: "Sher@123",
    AUTH_API: "https://api.d99hub.com/api/auth",
    SPORTSBOOK_API: "https://api.d99hub.com/api/client/sports-book-new/1"
  }
};

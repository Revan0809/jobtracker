// Tokens live in localStorage rather than an httpOnly cookie: the backend is a
// pure JSON API (no cookie/session support), and this keeps the auth flow
// simple for a portfolio-scale app. The trade-off is XSS exposure — see
// ARCHITECTURE.md for the reasoning and what a hardened version would do
// differently (httpOnly refresh cookie + short-lived in-memory access token).
const ACCESS_TOKEN_KEY = "jobtracker_access_token";
const REFRESH_TOKEN_KEY = "jobtracker_refresh_token";

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Shared URLs for playwright.config.js and the tests.
// The ports are intentionally non-standard so they don't clash with a local `npm run dev`.
export const BACKEND_PORT = 4300
export const FRONTEND_PORT = 4301

export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`
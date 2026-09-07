// Спільні адреси для playwright.config.js і для тестів.
// Порти навмисно нестандартні, щоб не перетинатись з локальним npm run dev.
export const BACKEND_PORT = 4300
export const FRONTEND_PORT = 4301

export const BACKEND_URL = `http://localhost:${BACKEND_PORT}`
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`

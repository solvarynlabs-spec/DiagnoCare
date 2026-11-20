/** One-click demo sign-in is available in development, or when explicitly enabled. */
export const DEMO_LOGIN_ENABLED = () => process.env.NODE_ENV !== "production" || process.env.ENABLE_DEMO_LOGIN === "true";

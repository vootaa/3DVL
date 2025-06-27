// Development configuration
export const DEV_Config = {
  // Whether to enable development logs (disabled in production)
  LOG_ENABLED: process.env.NODE_ENV === 'development',

  // Default log interval (milliseconds)
  LOG_INTERVAL: 1000
}
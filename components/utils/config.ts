// Development configuration
export const DEV_Config = {
  // Whether to enable development logs (disabled in production)
  LOG_ENABLED: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',

  // Default log interval (milliseconds) - reduced for better debugging
  LOG_INTERVAL: 500,
  
  // Enable enhanced drift debugging
  DRIFT_DEBUG_ENABLED: true
}
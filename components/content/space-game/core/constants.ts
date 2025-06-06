export enum GameState {
    LAUNCH = 'LAUNCH',           // State A: Launch Screen
    BATTLE = 'BATTLE',           // State B: Battle Mode
    EXPLORE = 'EXPLORE',         // State C: Exploration Mode
    OBSERVATION = 'OBSERVATION'  // State D: Observation Mode
}
  
// Development configuration
export const DEV_Config = {
  // Whether to enable development logs (disabled in production)
  LOG_ENABLED: process.env.NODE_ENV === 'development',

  // Default log interval (milliseconds)
  LOG_INTERVAL: 1000
}
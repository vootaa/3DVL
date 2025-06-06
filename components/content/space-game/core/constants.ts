export enum GameState {
  LAUNCH = 'LAUNCH',           // State A: Launch Screen
  BATTLE = 'BATTLE',           // State B: Battle Mode
  EXPLORE = 'EXPLORE',         // State C: Exploration Mode
  OBSERVATION = 'OBSERVATION'  // State D: Observation Mode
}

// Camera and view settings
export const CAMERA_CONSTANTS = {
  // Orbit control limits
  MIN_ORBIT_DISTANCE: 30,     // Minimum camera distance in orbit mode
  MAX_ORBIT_DISTANCE: 450,    // Maximum camera distance in orbit mode

  // Orbit angle limits
  MIN_ORBIT_HEIGHT: -Math.PI / 3,  // Minimum orbit height angle (radians)
  MAX_ORBIT_HEIGHT: Math.PI / 3,   // Maximum orbit height angle (radians)

  MIN_ORBIT_ANGLE: -Math.PI * 1.5,  //  Minimum orbit angle (radians)
  MAX_ORBIT_ANGLE: Math.PI * 1.5,   // Maximum orbit angle (radians)

  // Orbit control parameters
  ORBIT_CONTROL: {
    HORIZONTAL_SENSITIVITY: 0.0025, // Horizontal rotation sensitivity
    VERTICAL_SENSITIVITY: 0.0015,   // Vertical rotation sensitivity
    DAMPING: 0.92,                 // Orbit damping coefficient
    MIN_VELOCITY: 0.0001,          // Minimum velocity threshold
    ZOOM_SPEED: 10,                // Zoom speed
    ZOOM_DAMPING: 0.8               // Zoom damping factor
  }
}

// Development configuration
export const DEV_Config = {
  // Whether to enable development logs (disabled in production)
  LOG_ENABLED: process.env.NODE_ENV === 'development',

  // Default log interval (milliseconds)
  LOG_INTERVAL: 1000
}
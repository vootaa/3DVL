// Ship control parameters - Centralized management of all constants for easy adjustment
export const SHIP_CONTROLS = {
  // Flight position control
  POSITION: {
    RANGE_X: 45,          // X-axis movement range
    RANGE_Y: 30,          // Y-axis movement range
    OFFSET_Y: 10,         // Y-axis offset (keeps ship in upper portion of screen)
    SMOOTHING: 0.1,       // Position smoothing factor (smaller = smoother)
    RESPONSE_CURVE: 0.75  // Response curve exponent (>1 more sensitive at edges, <1 more sensitive at center)
  },
  // Ship rotation control
  ROTATION: {
    Z_FACTOR: 0.4,      // Z-axis rotation factor (banking)
    X_FACTOR: 0.3,      // X-axis rotation factor (pitch)
    Y_FACTOR: 0.2,      // Y-axis rotation factor (yaw)
    SMOOTHING: 0.15      // Rotation smoothing factor
  },
  // Inertial physics model
  PHYSICS: {
    MASS: 1.0,           // Mass feeling
    DAMPING: 0.85,       // Damping (air resistance)
    RETURN_FORCE: 0.03   // Reset force (auto-centering)
  },
  // Observation mode
  OBSERVATION: {
    RESET_RATE: 0.05,     // Reset rate
    HOVER_PERIOD: 3.0,    // Hover period (seconds)
    HOVER_AMPLITUDE: 0.3  // Hover amplitude
  },
  // Float effect
  FLOAT_EFFECT: {
    FREQUENCY: 40,      // Float frequency
    AMPLITUDE: 0.2      // Float amplitude
  },
  // Development configuration
  DEV: {
    LOG_ENABLED: process.env.NODE_ENV === 'development',
    LOG_INTERVAL: 1000  // Log interval (milliseconds)
  }
}
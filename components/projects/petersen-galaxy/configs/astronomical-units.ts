/**
 * Astronomical Units Configuration
 * Provides conversion and formatting for various astronomical distance and velocity units
 */

export interface AstronomicalUnit {
  name: string
  symbol: string
  description: string
  meterConversion: number // meters per unit
  category: 'distance' | 'velocity' | 'time'
}

export const ASTRONOMICAL_UNITS = {
  // Distance Units
  distance: {
    // Galaxy-specific units
    GU: {
      name: 'Galaxy Unit',
      symbol: 'GU',
      description: 'Relative galaxy scale unit (simulation scale)',
      meterConversion: 1, // Base unit for our simulation
      category: 'distance' as const
    },
    MGU: {
      name: 'Milli Galaxy Unit',
      symbol: 'mGU',
      description: '1/1000 Galaxy Unit',
      meterConversion: 0.001,
      category: 'distance' as const
    },
    NGU: {
      name: 'Nano Galaxy Unit',
      symbol: 'nGU',
      description: '1/1,000,000,000 Galaxy Unit',
      meterConversion: 1e-9,
      category: 'distance' as const
    }
  },

  // Velocity Units
  velocity: {
    KM_S: {
      name: 'Kilometers per second',
      symbol: 'km/s',
      description: 'Standard astronomical velocity unit',
      meterConversion: 1000,
      category: 'velocity' as const
    },
    C: {
      name: 'Speed of Light',
      symbol: 'c',
      description: 'Fraction of light speed',
      meterConversion: 299792458,
      category: 'velocity' as const
    },
    AU_YEAR: {
      name: 'AU per year',
      symbol: 'AU/yr',
      description: 'Astronomical units per year',
      meterConversion: 149597870700 / (365.25 * 24 * 3600),
      category: 'velocity' as const
    }
  }
} as const

/**
 * Format a number with appropriate precision and unit
 */
export function formatWithUnit(
  value: number,
  unit: string,
  category: 'distance' | 'velocity',
  precision: number = 3
): string {
  // Auto-adjust precision based on magnitude
  let displayPrecision = precision
  if (Math.abs(value) < 0.001) {
    displayPrecision = 8
  } else if (Math.abs(value) < 1) {
    displayPrecision = 6
  } else if (Math.abs(value) > 1000) {
    displayPrecision = 1
  }
  
  // Get unit symbol
  let symbol = unit
  if (category === 'distance') {
    const distanceUnits = ASTRONOMICAL_UNITS.distance
    const unitKey = unit as keyof typeof distanceUnits
    if (distanceUnits[unitKey]) {
      symbol = distanceUnits[unitKey].symbol
    }
  }
  
  return `${value.toFixed(displayPrecision)} ${symbol}`
}

/**
 * Get the best unit for displaying a value (auto-scaling)
 */
export function getBestUnit(
  value: number,
  category: 'distance' | 'velocity',
  currentUnit: string = 'GU'
): string {
  if (category === 'distance') {
    const absValue = Math.abs(value)
    
    // For very small values, use smaller units
    if (absValue < 0.001) return 'nGU'
    if (absValue < 1) return 'mGU'
    if (absValue < 1000) return 'GU'
    
    // For larger values, could scale to astronomical units
    return 'GU'
  }
  
  return currentUnit
}



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
    AU: {
      name: 'Astronomical Unit',
      symbol: 'AU',
      description: 'Average distance between Earth and Sun',
      meterConversion: 149597870700, // ~150 million km
      category: 'distance' as const
    },
    LY: {
      name: 'Light Year',
      symbol: 'ly',
      description: 'Distance light travels in one year',
      meterConversion: 9460730472580800, // ~9.46 trillion km
      category: 'distance' as const
    },
    PC: {
      name: 'Parsec',
      symbol: 'pc',
      description: 'Distance at which 1 AU subtends 1 arcsecond',
      meterConversion: 3.0857e16, // ~3.26 light years
      category: 'distance' as const
    },
    KPC: {
      name: 'Kiloparsec',
      symbol: 'kpc',
      description: '1000 parsecs',
      meterConversion: 3.0857e19,
      category: 'distance' as const
    },
    MPC: {
      name: 'Megaparsec',
      symbol: 'Mpc',
      description: '1 million parsecs',
      meterConversion: 3.0857e22,
      category: 'distance' as const
    },
    KM: {
      name: 'Kilometer',
      symbol: 'km',
      description: '1000 meters',
      meterConversion: 1000,
      category: 'distance' as const
    },
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
 * Convert a value from one unit to another
 */
export function convertUnit(
  value: number, 
  fromUnit: string,
  toUnit: string,
  category: 'distance' | 'velocity'
): number {
  // Simple conversion for now - could be expanded later
  if (fromUnit === toUnit) return value
  
  // Basic GU conversions
  if (category === 'distance') {
    let baseValue = value
    
    // Convert from unit to GU
    if (fromUnit === 'mGU') baseValue = value / 1000
    else if (fromUnit === 'nGU') baseValue = value / 1000000000
    
    // Convert from GU to target unit
    if (toUnit === 'mGU') return baseValue * 1000
    else if (toUnit === 'nGU') return baseValue * 1000000000
    else if (toUnit === 'GU') return baseValue
  }
  
  return value
}

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

/**
 * Get unit information for display
 */
export function getUnitInfo(
  unit: string,
  category: 'distance' | 'velocity'
) {
  if (category === 'distance') {
    const distanceUnits = ASTRONOMICAL_UNITS.distance
    const unitKey = unit as keyof typeof distanceUnits
    return distanceUnits[unitKey] || null
  } else if (category === 'velocity') {
    const velocityUnits = ASTRONOMICAL_UNITS.velocity
    const unitKey = unit as keyof typeof velocityUnits
    return velocityUnits[unitKey] || null
  }
  return null
}

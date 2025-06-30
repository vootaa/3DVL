import { Color } from 'three'
import { clamp } from 'three/src/math/MathUtils.js'

import type { Vector2, Light } from 'three'
import type { shaderToySrc } from './shaderToySrc'

const { sqrt, cos, abs, sin, hypot } = Math

export type LightFn = (light: Light, uv: Vector2, iTime: number) => void

// Helper function to calculate vector length
const length = (v: Vector2) => hypot(v.x, v.y)

const color = new Color()
export const shaderToyLights = {
  sinusoidalTresJS: (light: Light, uv: Vector2, iTime: number) => {
    color.g = 0.5 * clamp((1.0 - sqrt(abs(cos(uv.y + uv.x + iTime)))) ** (sin(iTime) + 2.0), 0.2, 1)
    color.b = 0.5 * clamp((1.0 - sin(uv.y + iTime)) ** (cos(iTime) + 2.0), 0.2, 1)
    color.r = 0.5 * clamp(sin(iTime + uv.x + sin(uv.y + iTime)), 0.2, 1)
    // NOTE: Just taking one sample, but it'll be jerky.
    // Lerp to avoid big jumps in color.
    light.color.lerp(color, 0.06)
  },

  sinusoidalTresJS2: (light: Light, uv: Vector2, iTime: number) => {
    color.g = (1.0 - sqrt(abs(cos(uv.y + iTime * 0.1)))) ** (sin(iTime) + 2.0)
    color.b = (1.0 - sin(uv.y + iTime)) ** (cos(iTime) + 2.0)
    color.r = sin(iTime + uv.y + sin(uv.y + iTime))
    // NOTE: Just taking one sample, but it'll be jerky.
    // Lerp to avoid big jumps in color.
    light.color.lerp(color, 0.1)
  },

  // Dynamic Color Cycling light function
  petersenGraphDCC: (light: Light, uv: Vector2, iTime: number) => {
    // Simulating shader dynamic color scheme switching logic
    const cycleDuration = 15.0  // Switch color scheme every 15 seconds
    const totalCycles = 6.0     // 6 color schemes

    const globalTime = (iTime % (cycleDuration * totalCycles))
    const schemeTime = globalTime / cycleDuration
    const currentScheme = Math.floor(schemeTime)
    const blendFactor = schemeTime - currentScheme

    // Use smoothstep for smooth transitions
    const smoothBlend = blendFactor * blendFactor * (3.0 - 2.0 * blendFactor)

    // Define 6 color schemes with primary colors
    const colorSchemes = [
      { r: 1.0, g: 0.0, b: 0.5 },  // Neon Magenta
      { r: 0.0, g: 0.8, b: 1.0 },  // Electronic Cyan-Blue  
      { r: 0.0, g: 1.0, b: 0.3 },  // Matrix Green
      { r: 1.0, g: 0.5, b: 0.0 },  // Orange-Red Warning
      { r: 1.0, g: 0.84, b: 0.0 }, // Golden Data
      { r: 0.5, g: 0.0, b: 1.0 }   // Violet
    ]

    const current = colorSchemes[currentScheme % 6]
    const next = colorSchemes[(currentScheme + 1) % 6]

    // Interpolate between current and next color scheme
    color.r = current.r + (next.r - current.r) * smoothBlend
    color.g = current.g + (next.g - current.g) * smoothBlend
    color.b = current.b + (next.b - current.b) * smoothBlend

    // Add subtle variations based on UV coordinates, simulating Petersen graph geometric influence
    const geometryEffect = sin(length(uv) * 8.0 + iTime * 0.5) * 0.1
    color.r = clamp(color.r + geometryEffect, 0.1, 1.0)
    color.g = clamp(color.g + geometryEffect, 0.1, 1.0)
    color.b = clamp(color.b + geometryEffect, 0.1, 1.0)

    // Add subtle pulse effect
    const pulse = (sin(iTime * 2.0) * 0.5 + 0.5) * 0.15 + 0.85
    color.r *= pulse
    color.g *= pulse
    color.b *= pulse

    // Slower interpolation speed for smoother color transitions
    light.color.lerp(color, 0.05)
  },

  gamesOfSinus: (light: Light, uv: Vector2, iTime: number) => {
    // Based on color characteristics of gamesOfSinus shader
    const ph = 25.0 + (1.0 - uv.x) * 20.0
    const amp = 0.02 + uv.x / 5.0
    const y = 0.5 + sin(uv.x * ph + iTime) * amp

    color.r = sin(iTime + uv.x + sin(uv.y + iTime)) * 0.5 + 0.5
    color.g = (1.0 - sqrt(abs(cos(uv.y + uv.x + iTime)))) * 0.5 + 0.3
    color.b = (1.0 - sin(uv.y + iTime)) * 0.5 + 0.4

    // Adjust colors based on sine wave game characteristics
    const waveInfluence = sin(uv.x * 10.0 + iTime) * 0.2
    color.r = clamp(color.r + waveInfluence, 0.2, 1.0)
    color.g = clamp(color.g + waveInfluence, 0.2, 1.0)
    color.b = clamp(color.b + waveInfluence, 0.2, 1.0)

    light.color.lerp(color, 0.08)
  },

  petersenPlasmaGraph: (light: Light, uv: Vector2, iTime: number) => {
    // Based on plasma effects from Petersen Plasma Graph
    const dist = length(uv)
    const rotation = iTime * 0.1

    // Simulate multi-layer color effects of plasma
    color.r = sin(dist * 8.0 + iTime * 1.5) * 0.4 + 0.6
    color.g = sin(dist * 6.0 + iTime * 1.2 + 2.0) * 0.4 + 0.6
    color.b = sin(dist * 10.0 + iTime * 0.8 + 4.0) * 0.4 + 0.6

    // Add rotation-based effects
    const rotationEffect = sin(rotation * 5.0) * 0.15
    color.r = clamp(color.r + rotationEffect, 0.3, 1.0)
    color.g = clamp(color.g + rotationEffect, 0.3, 1.0)
    color.b = clamp(color.b + rotationEffect, 0.3, 1.0)

    light.color.lerp(color, 0.07)
  },
} as Record<keyof typeof shaderToySrc, LightFn>
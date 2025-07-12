
export interface RotationConfig {
  baseSpeed: number
  currentTime: number
  evolutionProgress: number
}

export class RotationManager {
  private static instance: RotationManager
  
  private baseRotationSpeed: number
  private globalTime: number
  private evolutionProgress: number

  private constructor() {
    this.baseRotationSpeed = 0.24 // Default from orbital-config
    this.globalTime = 0
    this.evolutionProgress = 0
  }

  static getInstance(): RotationManager {
    if (!RotationManager.instance) {
      RotationManager.instance = new RotationManager()
    }
    return RotationManager.instance
  }

  updateTime(time: number): void {
    this.globalTime = time
  }

  updateEvolution(progress: number): void {
    this.evolutionProgress = progress
  }

  setBaseSpeed(speed: number): void {
    this.baseRotationSpeed = speed
  }

  getBaseSpeed(): number {
    return this.baseRotationSpeed
  }

  getGlobalTime(): number {
    return this.globalTime
  }

  getEvolutionProgress(): number {
    return this.evolutionProgress
  }

  // For shader-based rotation (particles)
  getShaderUniforms(): Record<string, { value: any }> {
    return {
      uTime: { value: this.globalTime },
      uBaseRotationSpeed: { value: this.baseRotationSpeed },
      uEvolutionProgress: { value: this.evolutionProgress }
    }
  }

  // For component-based rotation (lines/meshes)
  getCurrentRotation(): number {
    return this.globalTime * this.baseRotationSpeed
  }

  // Get smooth evolution progress
  getSmoothEvolution(): number {
    return this.smoothstep(0.0, 1.0, this.evolutionProgress)
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
  }
}
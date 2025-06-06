import type { BufferGeometry, Material, Group, PointLight, Vector3 } from 'three'
import type { ShallowRef } from 'vue'

// Ship model data types
export interface GLTFNode {
  geometry: BufferGeometry
  material: Material | Material[]
}

export interface ShipModelData {
  'Renault_0'?: GLTFNode | null  // Light_Metal
  'Renault_1'?: GLTFNode | null  // Medium_Metal
  'Renault_2'?: GLTFNode | null  // Dark_Metal
  'Renault_3'?: GLTFNode | null  // Shield
  'Renault_4'?: GLTFNode | null  // Engine_Glow
  'Renault_5'?: GLTFNode | null  // Blue_Glow
  isLoaded: boolean
}

// Ship reference object types
export interface ShipRefs {
  main: ShallowRef<Group>
  laserGroup: ShallowRef<Group | Group[]>
  laserLight: ShallowRef<PointLight>
  exhaust: ShallowRef<Group>
  cross: ShallowRef<Group>
  target: ShallowRef<Group>
  position: Vector3
  direction: Vector3
}

// Ship control state type

export interface ShipControlState {
  velocity: {
    position: { x: number, y: number },
    rotation: { x: number, y: number, z: number }
  },
  lastLogTime: number
}
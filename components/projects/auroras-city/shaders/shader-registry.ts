import { plasmaShader } from './plasma-shader'
import { getPetersenGraphShader } from './petersen-graph-shader'
import { Logger } from '~/components/utils/logger'

export interface ShaderInfo {
    name: string
    fragmentCode: string
}

export const shaderRegistry = {
    'default-shader': {
        name: 'plasmaShader',
        fragmentCode: plasmaShader,
    },
    'petersen-graph': {
        name: 'petersenGraphMultiEffect',
        fragmentCode: getPetersenGraphShader(),
    }
} as const

export type ValidShaderName = keyof typeof shaderRegistry

// Get all available shader names
export function getAvailableShaders(): ValidShaderName[] {
    return Object.keys(shaderRegistry) as ValidShaderName[]
}

// Validate if shader name exists
export function isValidShaderName(shaderName: string): boolean {
    return shaderName in shaderRegistry
}

// Helper function to get shader code
export function getShaderCode(shaderName: string): string {
    const shader = shaderRegistry[shaderName as ValidShaderName]
    if (!shader) {
        Logger.warn('ShaderRegistry', `Shader "${shaderName}" not found, using default shader`)
        return shaderRegistry['default-shader'].fragmentCode
    }
    return shader.fragmentCode
}
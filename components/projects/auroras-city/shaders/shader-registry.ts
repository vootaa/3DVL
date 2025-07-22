import { testShader } from './default-shader'
import { getPetersenGraphShader } from './petersen-graph-shader'
import { getPetersenGraphPolygonShader } from './petersen-graph-polygon-shader'
import { Logger } from '~/components/utils/logger'

export interface ShaderInfo {
    name: string
    fragmentCode: string
}

export const shaderRegistry = {
    'default-shader': {
        name: 'testShader',
        fragmentCode: testShader(),
    },
    'petersen-graph': {
        name: 'petersenGraphMultiEffect',
        fragmentCode: getPetersenGraphShader(),
    },
    'petersen-graph-polygon': {
        name: 'petersenGraphPolygonMultiEffect',
        fragmentCode: getPetersenGraphPolygonShader(),
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


/**
 * Automatically rename the mainImage function in the shader code.
 * Uses shader.name as the function prefix instead of shaderName key.
 */
export function getShaderCodeWithRenamedMainImage(shaderName: string): string {
    const shader = shaderRegistry[shaderName as ValidShaderName]
    if (!shader) {
        Logger.warn('ShaderRegistry', `Shader "${shaderName}" not found, using default shader`)
        const defaultShader = shaderRegistry['default-shader']
        return getShaderCodeWithRenamedMainImageByInfo(defaultShader)
    }

    return getShaderCodeWithRenamedMainImageByInfo(shader)
}

/**
 * Validate if a string is a valid GLSL identifier
 */
function isValidGLSLIdentifier(name: string): boolean {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

/**
 * Helper function to rename mainImage using ShaderInfo
 */
function getShaderCodeWithRenamedMainImageByInfo(shader: ShaderInfo): string {
    const shaderCode = shader.fragmentCode
    let functionPrefix = shader.name

    // Ensure the function prefix is a valid GLSL identifier
    if (!isValidGLSLIdentifier(functionPrefix)) {
        Logger.warn('ShaderRegistry', `Shader name "${functionPrefix}" is not a valid GLSL identifier, sanitizing...`)
        functionPrefix = functionPrefix
            .replace(/-/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '')
            .replace(/^[0-9]/, '_$&')
    }

    // Rename mainImage to shader.name + MainImage
    const renamedCode = shaderCode
        // Match the standard mainImage function
        .replace(
            /void\s+mainImage\s*\(\s*out\s+vec4\s+(\w+)\s*,\s*in\s+vec2\s+(\w+)\s*\)/g,
            `void ${functionPrefix}MainImage(out vec4 $1, in vec2 $2)`
        )
        // Match possibly already renamed mainImage functions (prevent repeated renaming)
        .replace(
            /void\s+mainImage\d*\s*\(\s*out\s+vec4\s+(\w+)\s*,\s*in\s+vec2\s+(\w+)\s*\)/g,
            `void ${functionPrefix}MainImage(out vec4 $1, in vec2 $2)`
        )

    return renamedCode
}


/**
 * Get the renamed mainImage function name for a shader.
 * Uses shader.name as the function prefix.
 */
export function getMainImageFunctionName(shaderName: string): string {
    const shader = shaderRegistry[shaderName as ValidShaderName]
    if (!shader) {
        Logger.warn('ShaderRegistry', `Shader "${shaderName}" not found, using default shader`)
        return `${shaderRegistry['default-shader'].name}MainImage`
    }

    return `${shader.name}MainImage`
}
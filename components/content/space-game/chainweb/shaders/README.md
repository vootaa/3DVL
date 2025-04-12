# Shader Reference Code

This directory contains reference shader code that can be used for advanced visual effects in the ChainWeb visualization components.

## Current Status

The shader code in this directory is currently not directly used in the application. Instead, simpler shader implementations have been included directly in the component files for better maintainability and integration with the Vue component system.

## Intended Purpose

These shader files are kept as reference implementations for:

1. More advanced plasma and glow effects
2. Advanced particle systems
3. High-quality connection rendering
4. Custom post-processing effects

## Usage

If you need to implement more complex visual effects, you can:

1. Extract the relevant shader code from these files
2. Integrate them into the components using TresJS shader components
3. Adjust uniforms and parameters as needed

## Files

- `plasma-node.vert/frag`: Advanced shaders for node visualization with complex plasma effects
- `plasma-arc.vert/frag`: Advanced shaders for electric arc connections with detailed glow
- `petersen-graph.glsl`: Original shader implementation of the Petersen graph

## Future Development

For future development, these shaders can be improved and integrated more directly with the component system, potentially using shader modules or a more structured shader management system.

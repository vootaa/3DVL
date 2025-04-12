# ChainWeb Visualization Shaders

This directory contains the GLSL shader code used by the ChainWeb visualization components (`PlasmaNode`, `PlasmaArc`, `ConcentricRings`).

## Shaders

- **`plasma-node.vert` / `plasma-node.frag`**: Shaders for rendering individual plasma nodes. Used by `PlasmaNode.vue`.
- **`plasma-arc.vert` / `plasma-arc.frag`**: Shaders for rendering the connections between nodes. Used by `PlasmaArc.vue`.
- **`concentric-rings.vert` / `concentric-rings.frag`**: Shaders for rendering the guiding concentric rings. Used by `ConcentricRings.vue`.

## Usage

These shaders are imported directly into their respective Vue components using Vite's `?raw` import feature:

```typescript
import vertexShader from './shaders/plasma-node.vert?raw'
import fragmentShader from './shaders/plasma-node.frag?raw'
```

This approach keeps the shader logic separate for better maintainability, syntax highlighting, and potential reuse while ensuring they are bundled with the components.

## Previous Reference Shaders

The original `petersen-graph.glsl` and potentially more complex versions of `plasma-node` and `plasma-arc` shaders might exist in version history but are not currently used directly by the application components. The shaders present here are the ones actively used.

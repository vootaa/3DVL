# Tethers.vue Component Refactoring Comprehensive Technical Implementation Report

## 1. Component Goals and Functional Positioning

Tethers.vue is responsible for rendering 60 arch bridge connections between nodes in the Petersen Expanse scene. Each connection is implemented as a particle system, featuring flow, pulse, and glow visual effects. Its implementation, animation driving, attribute structure, and rendering technology must be consistent with the OrbitalSystem component. All dynamic calculations and animations are handled by the GPU (shader), while the CPU side is only responsible for static structure and parameter preparation.

---

## 2. Static Structure and Data Sources

### 2.1 Node Data

- Number of nodes: 20, configured in the `stars` array of `star-cluster-config.ts`.
- Attributes: Each node contains id, r (radius), theta (angle), orbit (orbit type), and type (visual type).
- Spatial coordinates: Calculated using the `polarToCartesian(r, theta)` utility function, with y fixed at 0 or slightly perturbed.

### 2.2 Connection Relationships

- Connection pairs: 60 in total, divided into 30 forward (upward arch) and 30 reverse (downward arch), configured in `tetherConnections` of `tether-config.ts`.
- Each connection is uniquely determined by two node ids, which are fully consistent with those in star-cluster-config.

---

## 3. Particle System and Shape Parameters

### 3.1 Particle Distribution

- Each connection consists of `particlesPerTether` (e.g., 64) particles, evenly distributed along the arch curve.
- Curve type: Quadratic Bézier or arc, with start and end points as node coordinates, and control point height controlled by the `archHeight` parameter (positive for upward arch, negative for downward arch).

### 3.2 Attribute Preparation (CPU Side)

- Only static parameters for each particle are generated: start point, end point, archHeight, normalized progress along the segment (0~1), tetherId, color, base opacity, etc.
- Real-time node positions are not transmitted; all dynamic rotation and animation are handled within the shader.

### 3.3 Global Rotation Implementation Principle

- The rotation positioning of Tethers, OrbitalSystem, and StellarCore all use the formula "polar coordinates + globalTime × rotationSpeed".
- The formula is: `angle = initialAngle + globalTime * rotationSpeed`.
- Here, `initialAngle` is the initial angle of each node/particle, `globalTime` is the unified global time parameter, and `rotationSpeed` is the unified rotation speed parameter (recommended to be consistent with OrbitalSystem).
- In Tethers and OrbitalSystem, rotation animation is mainly implemented on the shader (GPU) side, while StellarCore can be implemented on the JS (CPU) side to ensure synchronized rotation and visual consistency among the three systems.

---

## 4. Rendering and Animation Technical Solution

### 4.1 Rendering Technology

- Uses `<TresPoints>` + `<TresBufferGeometry>` + `<TresShaderMaterial>`, fully consistent with OrbitalSystem.
- All particle attributes are passed via attributes, and animation parameters are passed via uniforms.

### 4.2 Shader Design

- **Vertex Shader** (refer to `tether-vertex.glsl`):
  - Dynamically calculates the position of particles on the arch curve, supporting overall node rotation (via unified time, speed, and initial angle parameters).
  - Supports flow, pulse, opacity gradient, and other effects.
  - Compatible with the evolutionProgress parameter for fade-in animation.
- **Fragment Shader** (refer to `tether-fragment.glsl`):
  - Implements circular particles, glow, flow brightness variation, opacity gradient, and other visual effects.
  - Supports color, glow intensity, blend mode, and other parameters.

### 4.3 Animation Parameters

- Rotation speed, initial angle, flow speed, pulse frequency, glow intensity, etc., are all passed via uniforms, with parameters configured in `tether-config.ts`.
- Animation is driven only by a unified time parameter (such as globalTime), ensuring synchronization with OrbitalSystem. See the global rotation implementation principle.

---

## 5. Configuration and Visualization Parameters

- **Core configuration files**:
  - `tether-config.ts`: Contains all visual, animation, and performance parameters for the Tethers particle system (such as `particlesPerTether`, `particleSize`, `archHeight`, `baseOpacity`, `glowIntensity`, `flowSpeed`, `pulseFrequency`, `colors`, `blendMode`, `renderOrder`, `maxTethers`).
  - `star-cluster-config.ts`: Defines the static attributes of 20 nodes (id, r, theta, orbit, type), with node spatial distribution consistent with orbit parameters.
- **Parameter consistency recommendations**:
  - Particle size (`particleSize`) is recommended to be coordinated with star and orbit particle ranges to avoid visual abruptness.
  - Dynamic parameters such as rotation speed are recommended to be consistent with OrbitalSystem to ensure synchronization among the three systems.
- **Node visual parameters**:
  - Node endpoint color, size, brightness, and other visual attributes can be obtained via `starClusterUtils.getStarVisuals(type)`, facilitating endpoint effect extensions.
- **All parameters are centrally managed** for easy maintenance and unified adjustment, ensuring Tethers is stylistically consistent with other core components.

---

## 6. Structure and Rendering Decoupling

- **Structure generation**: Node positions, connection pairs, arch parameters, etc., are all generated by the shape utility module, outputting static particle attributes.
- **Rendering implementation**: Fully reuses the particle system rendering, shader animation, and attribute passing technical path of OrbitalSystem, with only shape data and visual parameters differing.
- **Independent configuration**: All parameters are concentrated in `tether-config.ts` and `star-cluster-config.ts` for easy maintenance and expansion.

---

## 7. Key Implementation Points and Precautions

- Attribute naming, type, and itemSize must be fully consistent with shader attributes to avoid rendering errors.
- Only render TresPoints when all attributes are ready and lengths match to avoid Tres errors caused by empty data.
- Animation and rendering timing must be strictly synchronized to avoid rendering when data is not ready.
- All animation and effects are implemented within the shader; the CPU side does not perform real-time position calculations.
- Structure, animation, and visual parameters are separated for easy future expansion and maintenance.

---

## 8. Comparison and Reuse with OrbitalSystem

| Aspect        | OrbitalSystem                    | Tethers.vue (This Implementation)      |
| ------------- | ------------------------------- | -------------------------------------- |
| Node Data     | 3 sets of evenly distributed static parameters | star-cluster-config static configuration |
| Connection    | Only orbits, no cross-node connections | tether-config 60 arch bridge connections |
| Particle Dist.| Evenly distributed on circles    | Evenly distributed on arch curves      |
| Attribute Prep| Particle count, color, id        | Connection pairs, particle count, color, id |
| Animation     | Rotation speed, initial angle (uniform) | Flow speed, pulse frequency (uniform)  |
| Visual Effect | Color, size, opacity             | Color, size, opacity, glow, pulse      |
| Rendering     | TresPoints + ShaderMaterial      | TresPoints + ShaderMaterial            |
| Config Mgmt   | configs/orbital-config.ts        | configs/tether-config.ts + star-cluster-config.ts |

---

## 9. Testing and Acceptance Criteria

- Particle system renders without errors, all connections are visible, and animation is smooth.
- Visual effects (flow, glow, pulse) are consistent with configuration, and forward/reverse colors are clearly distinguished.
- Animation is synchronized with OrbitalSystem, and the overall visual style is unified.
- Parameter adjustments are immediately reflected in the visualization.
- Structure, animation, and visual parameters can be independently extended and maintained.

---

## 10. Conclusion

This report is the sole authoritative technical implementation basis for the Tethers.vue component.  
Development must strictly follow this report, combined with the implementation paradigm and shader design of OrbitalSystem, to ensure that Tethers.vue has high performance, strong maintainability, and consistent visualization effects.  
No additional features are required; priority is given to system stability, correct rendering, smooth animation, and controllable parameters.

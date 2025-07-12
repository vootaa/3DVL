# Petersen Expanse Project: Technical Summary & Feature Requirements Report

## 1. Project Summary

The **Petersen Expanse** is a 3D visualization project built with Vue and Three.js, simulating a stylized galaxy based on the Petersen Graph. Its architecture is modular, with clear separation between rendering, animation, HUD (heads-up display), and configuration.

### Core Components

- **StellarCore**  
    Renders 20 key stars (nodes) positioned according to the Petersen Graph's polar coordinates. Each star has type-based color, size, and animation (twinkle, pulse, color shift), and transitions from a "chaotic" to an "orbital" position as the simulation evolves.

- **OrbitalSystem**  
    Implements the galaxy's ring and scattered particle system, using custom shaders for dynamic orbital motion, color, and brightness. The system supports smooth evolution progress and is highly configurable.

- **HUD Components**  
    Includes `CameraInfo`, `DriftMonitor`, `PerformanceMonitor`, and `EvolutionTimeline`, providing real-time feedback on camera state, drift statistics, performance metrics, and simulation progress.

- **Animation & State Management**  
    `EvolutionAnimator` and `useEvolutionState` composable manage the timeline, animation progress, and enable/disable controls for StellarCore and OrbitalSystem.

- **Configuration**  
    All visual and physical parameters (star positions, colors, sizes, orbital radii, etc.) are centralized in config files for easy tuning.

### Visual & Technical Highlights

- **Shaders**: Both StellarCore and OrbitalSystem use custom GLSL shaders for advanced visual effects (glow, twinkle, color shift, orbital motion).
- **Particle Systems**: Both stars and orbital particles are rendered as GPU-accelerated point clouds, supporting tens of thousands of particles efficiently.
- **Responsive UI**: The HUD adapts to different display modes (full, compact, ultra-compact) and provides detailed unit references and statistics.
- **Documentation**: The project includes technical documentation and precise mapping of the Petersen Graph's nodes and connections.

---

## 2. New Feature Requirements: Tethers Component

### Overview

**Tethers** are a new visual and structural component representing the 60 connections (edges) of the Petersen Graph, connecting the 20 StellarCore nodes. Each Tether is visualized as an arched particle system, with 30 arches above (Y > 0) and 30 below (Y < 0) the XZ plane, forming a symmetrical 3D structure.

### Functional & Visual Requirements

#### 2.1. Tethers Construction

- **Connection Mapping**:  
    Use the Petersen Graph's connection pattern to define 60 edges:  
    - 30 "forward" connections (e.g., `[0,5]`, `[1,6]`, ...)  
    - 30 "reverse" connections (e.g., `[5,0]`, `[6,1]`, ...)

- **Node Reference**:  
    Each Tether connects two StellarCore nodes, using their current 3D positions (which may evolve over time).

#### 2.2. Particle System Implementation

- **Particle-Based Arches**:  
    Each Tether is rendered as a sequence of particles forming a smooth arch between its two nodes.  
    The arch's shape is defined by a parametric curve (e.g., quadratic or cubic Bézier), with the control point(s) offset along the Y axis:  
    - Forward Tethers: arch upward (Y > 0)  
    - Reverse Tethers: arch downward (Y < 0)

- **Shader Customization**:  
    Tethers use their own vertex and fragment shaders, optimized for glowing, fading, or animated effects (e.g., flowing particles, color gradients).  
    Visual distinction between forward and reverse Tethers (e.g., color, brightness, or animation direction).

#### 2.3. Integration & Behavior

- **Synchronization**:  
    Tethers update dynamically as StellarCore nodes move (e.g., during evolution animation).

- **State Management**:  
    Tethers are enabled/disabled via state management, similar to StellarCore and OrbitalSystem.

- **Performance**:  
    Efficient GPU instancing or batching for all 60 Tethers, supporting smooth animation and interaction.

- **Configurability**:  
    Tether appearance (color, thickness, particle count, arch height, animation speed) is configurable via a dedicated config file.

#### 2.4. Visual Design Guidelines

- **3D Structure**:  
    Tethers must be visually distinct from the flat XZ-plane rings and stars, emphasizing the 3D connectivity of the Petersen Graph.  
    The arches should not intersect the StellarCore nodes directly but connect smoothly to their surfaces.

- **Aesthetic Effects**:  
    Consider subtle glow, animated flow, or pulsing effects to highlight active connections.
    Just like orbits and stars, during the evolution process, they also move from a chaotic particle system to their final target position.
    Allow toggling between showing all Tethers or none.


---

## 3. Deliverables

- **Tethers Component**:  
    New Vue component (e.g., `Tethers.vue`) implementing the above requirements.

- **Custom Shaders**:  
    Vertex/fragment shaders for Tether particle effects.

- **Configuration**:  
    Tether visual and behavioral parameters in a dedicated config file.

- **Integration**:  
    State management and UI controls for enabling/disabling Tethers.

- **Documentation**:  
    Technical documentation describing Tether construction, shader logic, and integration points.

---

## 4. Summary

The Tethers feature will complete the Petersen Graph's 3D visualization by explicitly rendering all 60 connections as dynamic, visually rich arches, leveraging the existing particle system and shader infrastructure. This will provide both mathematical clarity and aesthetic enhancement, further distinguishing the Petersen Expanse as a unique scientific and artistic visualization.

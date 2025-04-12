ChainWeb 3D Visualization Development Specification

# Overview

This specification outlines the implementation of a ChainWeb blockchain visualization in the form of a 3D representation and a Petersen Graph portal entrance for the Space Game. The development will follow a component-based architecture using TresJS (Vue wrapper for Three.js) with specialized GLSL shaders for visual effects.

# Core Components

1. **Visualization Components**
   - PlasmaNode: Renders individual blockchain nodes with plasma effects
   - PlasmaArc: Creates electric arc connections between nodes
   - ConcentricRings: Renders the circular rings that organize nodes
   - PetersenGraphPortal: Implements the 2D portal entrance
   - ChainWeb3D: Implements the 3D blockchain visualization

2. **Shaders**
   - plasma-node.vert/frag: Shaders for node visualization
   - plasma-arc.vert/frag: Shaders for electric arc connections

# Development Plan

## Phase 1: Core Infrastructure

- Create directory structure for chainweb components
- Extract and adapt shader code from 'PetersenPlasmaGraph.glsl'
- Create base visualization utility classes

## Phase 2: Basic Components

- Implement PlasmaNode component
- Implement ConcentricRings component (similar to the existing Rings.vue)
- Implement PlasmaArc component
- Create data models for node and connection representations with TypeScript

## Phase 3: Composite Visualizations

- Implement PetersenGraphPortal component (2D representation) at the game's starting position
- Implement ChainWeb3D component (3D representation) positioned after the Rings
- Add acceleration effects when the player passes through the innermost ConcentricRings

## Phase 4: Integration

- Position components along the tracking path similar to Rings.vue
- Reference the Track.vue and Rings.vue components for proper placement
- Reference the randomRings function in GameStore.ts for component distribution
- Implement acceleration effect similar to the warp effect in GameStore.ts update function
- Optimize performance for the additional visual elements

# Technical Specifications

## Component Placement

- **PetersenGraphPortal**: Positioned at the game's starting point (t ≈ 0.0)
- **ChainWeb3D**: Positioned after the Rings sequence (t ≈ 0.6-0.75)
- Both components are centered on the tracking path like Rings
- Components should use the same scale and position calculation methods as Rings.vue

## Interaction Effects

- When passing through the PetersenGraphPortal, a visual transition effect occurs
- When entering the innermost ring of ChainWeb3D, an acceleration effect similar to Rings is triggered
- The acceleration effect should affect the camera FOV and movement speed
- Effects should be triggered by proximity or collision detection

## ChainWeb3D Multilayer Structure

The ChainWeb3D visualization consists of multiple layers with the following characteristics:

1. **Shared Components with PetersenGraphPortal**:
   - Each layer contains 20 plasma nodes
   - Each layer has 3 concentric rings for node organization

2. **Key Differences**:
   - **Connection Types**:
     - PetersenGraphPortal: Electric arcs connect nodes within the same plane
     - ChainWeb3D: Electric arcs connect nodes between adjacent layers

   - **Arc Quantity**:
     - PetersenGraphPortal: 30 arcs (single directional connections, A→B only)
     - ChainWeb3D: 60 arcs between layers (bi-directional connections, both A→B and B→A)

   - **Connection Logic**:
     - Implemented in TypeScript to determine which nodes connect
     - Inter-layer connections follow a specific pattern to represent blockchain cross-chain connections

3. **Layer Stack**:
   - Layers are positioned sequentially along the z-axis
   - Each subsequent layer is slightly smaller to create a tunnel perspective
   - Connections between layers create a 3D mesh structure

## Visual Parameters

- **Nodes**: 20 nodes per layer, distributed across three concentric rings
- **Rings**:
  - Inner (r=0.15)
  - Middle (r=0.3)
  - Outer (r=0.48)
- **Colors**: Configurable, with default common color scheme for integration
- **Tunnel Depth**: 8-10 layers for optimal visual effect

## Data Structure

```typescript
interface ChainNode {
  id: number;
  chainId: number;
  layerId: number; // Layer identification
  x: number;
  y: number
  z: number;
  color: string;
  radius: number;
  connections: Connection[];
}

interface Connection {
  toNode: number;
  toLayer: number; // Target layer for inter-layer connections
  type: ConnectionType;
  color: string;
}

enum ConnectionType {
  INTRA_LAYER = 0, // Connection within the same layer
  INTER_LAYER = 1  // Connection between different layers
}

interface LayerConfiguration {
  z: number; // Z-position of the layer
  scale: number; // Scale factor for the layer (decreasing for depth effect)
  rings: RingConfiguration[];
}

interface RingConfiguration {
  radius: number;
  color: string;
  thickness: number;
}

// Connection logic
function generateIntraLayerConnections(nodes: ChainNode[], layer: number): Connection[] {
  // Logic for connections within the same layer (30 connections)
  // Used primarily in PetersenGraphPortal
}

function generateInterLayerConnections(sourceLayer: ChainNode[], targetLayer: ChainNode[]): Connection[] {
  // Logic for connections between adjacent layers (60 connections)
  // Used primarily in ChainWeb3D
}
```

## Performance Considerations

- Use instanced rendering for multiple similar objects
- Implement LOD (Level of Detail) for distant nodes
- Employ frustum culling for offscreen objects
- Optimize shader complexity based on device capabilities

# Implementation Sequence

- Start with shader utilities and base components
- Build the PetersenPortal as a standalone visualization first
- Extend to the ChainWeb3D with shared components
- Integrate with the existing Space Game mechanics

This modular approach allows for focused testing of each component before integration and simplifies debugging of visual effects.

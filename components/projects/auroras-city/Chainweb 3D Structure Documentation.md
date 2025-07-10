Chainweb 3D Structure Documentation
Overview
The Chainweb 3D structure is a multi-layered blockchain network visualization that represents the Kadena Chainweb architecture. It consists of multiple identical layers stacked vertically, where each layer contains 20 nodes arranged in three concentric rings with specific connectivity patterns.

Layer Structure
Node Distribution per Layer
Total Nodes: 20 nodes per layer
Inner Ring: 5 nodes (chain IDs 5-9) at radius 0.3
Middle Ring: 5 nodes (chain IDs 0-4) at radius 0.6
Outer Ring: 10 nodes (chain IDs 10-19) at radius 0.96

Ring Specifications
const RING_CONFIG = {
  inner: {
    radius: 0.3,
    nodeCount: 5,
    chainIds: [5, 6, 7, 8, 9],
    thickness: 0.005
  },
  middle: {
    radius: 0.6,
    nodeCount: 5, 
    chainIds: [0, 1, 2, 3, 4],
    thickness: 0.005
  },
  outer: {
    radius: 0.96,
    nodeCount: 10,
    chainIds: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    thickness: 0.005
  }
}

Node Positioning (Polar Coordinates)
Nodes are positioned using polar coordinates with predefined angles:

const ANGLES = [
  // Middle ring (0-4): 5-fold symmetry
  5.0265, 0.0, 1.2566, 2.5133, 3.7699,
  // Inner ring (5-9): aligned with middle ring
  5.0265, 0.0, 1.2566, 2.5133, 3.7699,
  // Outer ring (10-19): 10 nodes with varied spacing
  4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444
]

Connection Patterns
Cross-Chain Connections (Within Layer)
Each layer has 36 bidirectional cross-chain connections:
const CONNECTIONS = [
  // Middle to Inner (5 connections)
  [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
  // Middle to Outer Group 1 (5 connections) 
  [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
  // Middle to Outer Group 2 (5 connections)
  [0, 15], [1, 16], [2, 17], [3, 18], [4, 19],
  // Inner Circular (5 connections)
  [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],
  // Outer Circular Group 1 (5 connections)
  [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
  // Outer Circular Group 2 (5 connections)
  [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]
]

Inter-Layer Connections
Same-Chain Connections: 20 vertical connections per layer pair (chain ID i in layer n connects to chain ID i in layer n+1)
Cross-Chain Connections: 72 diagonal connections per layer pair (36 forward + 36 reverse based on CONNECTIONS matrix)

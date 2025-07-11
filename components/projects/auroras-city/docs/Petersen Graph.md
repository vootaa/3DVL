# Petersen Graph Architectural Design Technical Documentation

## 1. Basic Data Structures

### 1.1 Polar Coordinate Node Configuration

**Precise polar coordinate data:**

    // Node positions (radius, angle)
    nodes: [
    // Middle (r=3.0)
    { id: 0, r: 3.0, theta: 288.0, cicle: 'middle', type: 'golden' },
    { id: 1, r: 3.0, theta: 0.0, cicle: 'middle', type: 'golden' },
    { id: 2, r: 3.0, theta: 72.0, cicle: 'middle', type: 'golden' },
    { id: 3, r: 3.0, theta: 144.0, cicle: 'middle', type: 'golden' },
    { id: 4, r: 3.0, theta: 216.0, cicle: 'middle', type: 'golden' },

    // Inner (r=1.5)
    { id: 5, r: 1.5, theta: 288.0, cicle: 'inner', type: 'green' },
    { id: 6, r: 1.5, theta: 0.0, cicle: 'inner', type: 'green' },
    { id: 7, r: 1.5, theta: 72.0, cicle: 'inner', type: 'green' },
    { id: 8, r: 1.5, theta: 144.0, cicle: 'inner', type: 'green' },
    { id: 9, r: 1.5, theta: 216.0, orciclebit: 'inner', type: 'green' },
    
    // Outer (r=4.8)
    { id: 10, r: 4.8, theta: 278.0, cicle: 'outer', type: 'blue' },
    { id: 11, r: 4.8, theta: 10.0, cicle: 'outer', type: 'blue' },
    { id: 12, r: 4.8, theta: 62.0, cicle: 'outer', type: 'blue' },
    { id: 13, r: 4.8, theta: 154.0, cicle: 'outer', type: 'blue' },
    { id: 14, r: 4.8, theta: 206.0, cicle: 'outer', type: 'blue' },
    { id: 15, r: 4.8, theta: 298.0, cicle: 'outer', type: 'blue' },
    { id: 16, r: 4.8, theta: 350.0, cicle: 'outer', type: 'blue' },
    { id: 17, r: 4.8, theta: 82.0, cicle: 'outer', type: 'blue' },
    { id: 18, r: 4.8, theta: 134.0, cicle: 'outer', type: 'blue' },
    { id: 19, r: 4.8, theta: 226.0, cicle: 'outer', type: 'blue' }
  ],

## 2. Connection Patterns
    CONNECTIONS : [
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

# Petersen Graph

Nodes= {
  // Middle (r=3.0)
  { id: 0, r: 3.0, theta: 288.0, orbit: 'middle'},
  { id: 1, r: 3.0, theta: 0.0, orbit: 'middle'},
  { id: 2, r: 3.0, theta: 72.0, orbit: 'middle'},
  { id: 3, r: 3.0, theta: 144.0, orbit: 'middle},
  { id: 4, r: 3.0, theta: 216.0, orbit: 'middle},

  // Inner (r=1.5)
  { id: 5, r: 1.5, theta: 288.0, orbit: 'inner'},
  { id: 6, r: 1.5, theta: 0.0, orbit: 'inner'},
  { id: 7, r: 1.5, theta: 72.0, orbit: 'inner'},
  { id: 8, r: 1.5, theta: 144.0, orbit: 'inner},
  { id: 9, r: 1.5, theta: 216.0, orbit: 'inner},
  
  // Outer (r=4.8)
  { id: 10, r: 4.8, theta: 278.0, orbit: 'outer'},
  { id: 11, r: 4.8, theta: 10.0, orbit: 'outer'},
  { id: 12, r: 4.8, theta: 62.0, orbit: 'outer'},
  { id: 13, r: 4.8, theta: 154.0, orbit: 'outer'},
  { id: 14, r: 4.8, theta: 206.0, orbit: 'outer'},
  { id: 15, r: 4.8, theta: 298.0, orbit: 'outer'},
  { id: 16, r: 4.8, theta: 350.0, orbit: 'outer'},
  { id: 17, r: 4.8, theta: 82.0, orbit: 'outer'},
  { id: 18, r: 4.8, theta: 134.0, orbit: 'outer'},
  { id: 19, r: 4.8, theta: 226.0, orbit: 'outer'}
},

Connections = {
  // Forward connections (flow from first to second)
  forward: [
    // Inner to Middle orbit connections
    [5, 0], [6, 1], [7, 2], [8, 3], [9, 4],
    // Middle to Outer orbit connections  
    [0, 10], [1, 11], [2, 12], [3, 13], [4, 14],
    [0, 15], [1, 16], [2, 17], [3, 18], [4, 19],
    // Inner orbit internal connections
    [5, 7], [6, 8], [7, 9], [8, 5], [9, 6],
    // Outer orbit ring connections
    [10, 11], [11, 12], [12, 13], [13, 14], [14, 15],
    [15, 16], [16, 17], [17, 18], [18, 19], [19, 10]
  ],

  // Reverse connections (flow from first to second, opposite direction)
  reverse: [
    // Middle to Inner orbit connections
    [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    // Outer to Middle orbit connections
    [10, 0], [11, 1], [12, 2], [13, 3], [14, 4],
    [15, 0], [16, 1], [17, 2], [18, 3], [19, 4],
    // Inner orbit reverse internal connections
    [7, 5], [8, 6], [9, 7], [5, 8], [6, 9],
    // Outer orbit reverse ring connections
    [11, 10], [12, 11], [13, 12], [14, 13], [15, 14],
    [16, 15], [17, 16], [18, 17], [19, 18], [10, 19]
  ]
}

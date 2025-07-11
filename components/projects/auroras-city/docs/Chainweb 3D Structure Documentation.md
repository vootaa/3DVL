# Chainweb 3D Structure Documentation

## Overview

The Chainweb 3D structure is a multi-layered blockchain network visualization representing the Kadena Chainweb architecture. Each layer contains 20 nodes arranged in three concentric rings, stacked vertically, with specific connectivity patterns.

---

## Layer Structure

- **Total Nodes per Layer:** 20
- **Inner Ring:** 5 nodes (chain IDs 5–9), radius: 1.5
- **Middle Ring:** 5 nodes (chain IDs 0–4), radius:  3.0
- **Outer Ring:** 10 nodes (chain IDs 10–19), radius: 4.8

## [Petersen Graph](../../petersen-expanse/docs/Petersen%20Graph.md)

---

### Inter-Layer Connections

- **Same-Chain Connections:**  
  20 vertical connections per layer pair (chain ID *i* in layer *n* connects to chain ID *i* in layer *n+1*).

- **Cross-Chain Connections:**  
  60 diagonal connections per layer pair (30 forward + 30 reverse, based on the `CONNECTIONS` matrix).

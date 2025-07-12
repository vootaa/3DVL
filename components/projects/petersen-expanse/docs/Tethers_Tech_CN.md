# Tethers.vue 组件重构综合技术实现报告

## 1. 组件目标与功能定位

Tethers.vue 负责在 Petersen Expanse 场景中渲染 60 条节点间拱桥连接线，每条连接线由粒子系统实现，具备流动、脉冲、发光等视觉特效。其实现方式、动画驱动、属性结构、渲染技术需与 OrbitalSystem 组件保持一致，所有动态计算和动画均交由 GPU（shader）完成，CPU 端仅负责静态结构和参数准备。

---

## 2. 静态结构与数据来源

### 2.1 节点数据

- 节点数量：20，配置于 `star-cluster-config.ts` 的 `stars` 数组。
- 属性：每个节点含 id、r（半径）、theta（角度）、orbit（轨道类型）、type（视觉类型）。
- 空间坐标：通过 `polarToCartesian(r, theta)` 工具函数计算，y 可固定为 0 或微扰。

### 2.2 连接关系

- 连接对：共 60 条，分为 30 条 forward（上拱）和 30 条 reverse（下拱），配置于 `tether-config.ts` 的 `tetherConnections`。
- 每条连接线由两个节点 id 唯一确定，节点 id 与 star-cluster-config 完全一致。

---

## 3. 粒子系统与形状参数

### 3.1 粒子分布

- 每条连接线由 `particlesPerTether`（如 64）个粒子组成，粒子沿拱桥曲线均匀分布。
- 曲线类型：二次贝塞尔或圆弧，起点终点为节点坐标，控制点高度由 `archHeight`（正值上拱，负值下拱）参数控制。

### 3.2 属性准备（CPU端）

- 仅生成每个粒子的静态参数：起点、终点、archHeight、粒子在线段上的归一化进度（0~1）、tetherId、颜色、基础透明度等。
- 不传递实时节点位置，所有动态旋转、动画均在 shader 内部完成。

### 3.3 全局旋转实现原理

- Tethers、OrbitalSystem、StellarCore 三大系统的旋转定位均采用“极坐标 + 全局时间 × 旋转速度”公式实现。
- 公式为：`angle = initialAngle + globalTime * rotationSpeed`。
- 其中，`initialAngle` 为每个节点/粒子的初始角度，`globalTime` 为统一的全局时间参数，`rotationSpeed` 为统一的旋转速度参数（建议与 OrbitalSystem 保持一致）。
- 在 Tethers 和 OrbitalSystem 中，旋转动画主要在 shader（GPU）端实现，StellarCore 可在 JS（CPU）端实现，保证三者结构同步旋转、视觉一致。

---

## 4. 渲染与动画技术方案

### 4.1 渲染技术

- 使用 `<TresPoints>` + `<TresBufferGeometry>` + `<TresShaderMaterial>`，与 OrbitalSystem 完全一致。
- 所有粒子属性通过 attribute 传递，动画参数通过 uniform 传递。

### 4.2 Shader 设计

- **Vertex Shader**（参考 `tether-vertex.glsl`）：
  - 动态计算粒子在拱桥曲线上的位置，支持节点整体旋转（通过统一时间、速度、初始角度参数）。
  - 支持流动（flow）、脉冲（pulse）、透明度渐变等特效。
  - 兼容 evolutionProgress（演化进度）参数，实现渐现动画。
- **Fragment Shader**（参考 `tether-fragment.glsl`）：
  - 实现圆形粒子、发光、流动亮度变化、透明度渐变等视觉效果。
  - 支持颜色、发光强度、混合模式等参数。

### 4.3 动画参数

- 旋转速度、初始角度、流动速度、脉冲频率、发光强度等全部通过 uniform 传递，参数配置于 `tether-config.ts`。
- 动画驱动仅依赖统一的时间参数（如 globalTime），保证与 OrbitalSystem 同步，参见全局旋转实现原理。

---

## 5. 配置与可视化参数

- **核心配置文件**：
  - `tether-config.ts`：包含所有 Tethers 粒子系统的视觉、动画、性能参数（如 `particlesPerTether`, `particleSize`, `archHeight`, `baseOpacity`, `glowIntensity`, `flowSpeed`, `pulseFrequency`, `colors`, `blendMode`, `renderOrder`, `maxTethers`）。
  - `star-cluster-config.ts`：定义 20 个节点的静态属性（id、r、theta、orbit、type），节点空间分布与轨道参数保持一致。
- **参数一致性建议**：
  - 粒子大小（`particleSize`）建议与星体和轨道粒子区间协调，避免视觉突兀。
  - 旋转速度等动态参数建议与 OrbitalSystem 保持一致，确保三大系统同步。
- **节点视觉参数**：
  - 可通过 `starClusterUtils.getStarVisuals(type)` 获取节点端点的颜色、大小、亮度等视觉属性，便于端点特效扩展。
- **所有参数集中管理**，便于维护和统一调整，确保 Tethers 与其它核心组件风格一致。

---

## 6. 结构与渲染解耦

- **结构生成**：节点位置、连接对、拱桥参数等全部由 shape 工具模块生成，输出粒子静态属性。
- **渲染实现**：完全复用 OrbitalSystem 的粒子系统渲染、shader 动画、属性传递等技术路径，仅 shape 数据和视觉参数不同。
- **配置独立**：所有参数集中在 `tether-config.ts` 和 `star-cluster-config.ts`，便于维护和扩展。

---

## 7. 关键实现要点与注意事项

- 属性命名、类型、itemSize 必须与 shader attribute 完全一致，避免渲染报错。
- 仅在所有属性准备好且长度匹配时渲染 TresPoints，避免空数据触发 Tres 报错。
- 动画与渲染时机严格同步，避免数据未准备好时渲染。
- 所有动画、特效均在 shader 内部实现，CPU 端不做实时位置计算。
- 结构、动画、视觉参数分离，便于后续扩展和维护。

---

## 8. 与 OrbitalSystem 的对比与复用

| 方面         | OrbitalSystem                    | Tethers.vue（本实现）           |
| ------------ | ------------------------------- | ------------------------------- |
| 节点数据     | 3 组圆周均匀分布，静态参数      | star-cluster-config 静态配置    |
| 连接结构     | 仅轨道，不跨节点连线            | tether-config 60 条拱桥连接线   |
| 粒子分布     | 圆周均匀分布                    | 拱桥曲线均匀分布                |
| 属性准备     | 粒子数量、颜色、id              | 连接对、粒子数量、颜色、id      |
| 动画驱动     | 旋转速度、初始角度（uniform）   | 流动速度、脉冲频率（uniform）   |
| 视觉特效     | 颜色、大小、透明度              | 颜色、大小、透明度、发光、脉冲  |
| 渲染方式     | TresPoints + ShaderMaterial      | TresPoints + ShaderMaterial      |
| 配置管理     | configs/orbital-config.ts        | configs/tether-config.ts + star-cluster-config.ts |

---

## 9. 测试与验收标准

- 粒子系统渲染无报错，所有连接线可见，动画流畅。
- 视觉特效（流动、发光、脉冲）与配置一致，forward/reverse 颜色区分明显。
- 动画与 OrbitalSystem 同步，整体视觉风格统一。
- 参数调整后可即时反映在可视化效果中。
- 结构、动画、视觉参数可独立扩展和维护。

---

## 10. 结论

本报告为 Tethers.vue 组件的唯一权威技术实现依据。  
开发时严格遵循本报告，结合 OrbitalSystem 的实现范式和 shader 设计，确保 Tethers.vue 具备高性能、强可维护性和一致的可视化效果。  
无需额外附加功能，优先保证系统稳定、渲染正确、动画流畅和参数可控。

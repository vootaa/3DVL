// 飞船控制参数 - 集中管理所有常量便于调整
export const SHIP_CONTROLS = {
  // 飞行位置控制
  POSITION: {
    RANGE_X: 20,        // X轴移动范围
    RANGE_Y: 15,        // Y轴移动范围
    OFFSET_Y: 15,       // Y轴偏移量(保持在屏幕上方)
    SMOOTHING: 0.1,     // 位置平滑系数(越小越平滑)
    RESPONSE_CURVE: 1.5 // 响应曲线指数(>1更灵敏边缘,<1更灵敏中心)
  },
  // 飞船旋转控制
  ROTATION: {
    Z_FACTOR: 0.3,      // Z轴旋转系数(侧倾)
    X_FACTOR: 0.2,      // X轴旋转系数(俯仰)
    Y_FACTOR: 0.1,      // Y轴旋转系数(偏航)
    SMOOTHING: 0.15     // 旋转平滑系数
  },
  // 惯性物理模型
  PHYSICS: {
    MASS: 1.0,          // 质量感
    DAMPING: 0.92,      // 阻尼(空气阻力)
    RETURN_FORCE: 0.05  // 重置力度(自动回正)
  },
  // 观察模式
  OBSERVATION: {
    RESET_RATE: 0.05,   // 复位速率
    HOVER_PERIOD: 3.0,  // 悬停周期(秒)
    HOVER_AMPLITUDE: 0.3 // 悬停幅度
  },
  // 浮动效果
  FLOAT_EFFECT: {
    FREQUENCY: 40,      // 浮动频率 
    AMPLITUDE: 0.2      // 浮动幅度
  },
  // 开发配置
  DEV: {
    LOG_ENABLED: process.env.NODE_ENV === 'development',
    LOG_INTERVAL: 1000  // 日志间隔(毫秒)
  }
}
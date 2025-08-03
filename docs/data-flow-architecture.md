# 数据流架构文档

## 概述

本文档描述了 VTuber 应用的数据流架构，包括数据传递路径、时序控制和健壮性保证。

## 数据流架构图

```
用户操作 → VTuberControls → 状态验证 → 数据流监控 → 组件更新
    ↓
摄像头数据 → MediaPipe处理 → 数据验证 → 动作捕捉更新 → 3D渲染
    ↓
模型/动画选择 → 资源加载 → 验证 → 场景更新
```

## 核心组件

### 1. 数据流监控器 (DataFlowMonitor)

**位置**: `src/lib/data-flow-monitor.ts`

**功能**:
- 记录所有数据流事件
- 监控性能指标
- 错误追踪
- 事件历史管理

**关键方法**:
```typescript
// 记录事件
logEvent(event: DataFlowEvent, data?: any, error?: string, duration?: number)

// 获取性能统计
getPerformanceStats()

// 获取最近错误
getRecentErrors()
```

### 2. 数据流验证器 (DataFlowValidator)

**功能**:
- 验证动作捕捉数据完整性
- 验证状态更新逻辑
- 确保数据一致性

**验证规则**:
- 动作捕捉数据必须包含 face、pose、hands 组件
- 摄像头开启时不能有错误状态
- 处理状态必须在摄像头开启时才能激活
- 模型和动画必须有有效 URL

### 3. 时序管理器 (DataFlowSequencer)

**功能**:
- 记录操作序列
- 验证时序正确性
- 检测异常操作

**时序规则**:
- 摄像头停止次数不能超过开启次数
- 处理结束次数不能超过开始次数
- 错误清除必须在错误发生之后

## 数据传递路径

### 1. 用户操作路径

```
用户点击 → VTuberControls → 状态验证 → 安全更新 → 组件渲染
```

**关键检查点**:
- 操作权限验证
- 状态一致性检查
- 错误状态处理

### 2. 摄像头数据路径

```
摄像头 → MediaPipe → 数据验证 → 动作捕捉更新 → 3D渲染
```

**关键检查点**:
- 数据完整性验证
- 性能监控
- 错误处理

### 3. 资源加载路径

```
用户选择 → 资源验证 → 加载 → 场景更新
```

**关键检查点**:
- URL 有效性
- 资源类型验证
- 加载状态管理

## 健壮性保证

### 1. 状态安全更新

使用 `safeSetState` 函数确保状态更新的安全性：

```typescript
const safeSetState = useCallback((updater: (prev: VTuberState) => VTuberState) => {
  setState(prevState => {
    const newState = updater(prevState);
    
    // 验证状态更新
    const validation = DataFlowValidator.validateStateUpdate(prevState, newState);
    if (!validation.isValid) {
      console.error('State update validation failed:', validation.errors);
      return prevState; // 保持原状态
    }
    
    return newState;
  });
}, []);
```

### 2. 数据验证

所有关键数据都经过验证：

```typescript
// 动作捕捉数据验证
const validation = DataFlowValidator.validateMocapData(mocapData);
if (!validation.isValid) {
  handleError(`Invalid mocap data: ${validation.errors.join(', ')}`);
  return;
}
```

### 3. 错误处理

统一的错误处理机制：

```typescript
const handleError = useCallback((error: string) => {
  dataFlowSequencer.recordOperation('error_occurred');
  dataFlowMonitor.logEvent(DataFlowEvent.ERROR_OCCURRED, null, error);
  
  safeSetState(prev => ({
    ...prev,
    error,
    isProcessing: false, // 发生错误时停止处理
  }));
}, [safeSetState]);
```

## 性能监控

### 1. 实时性能指标

- 平均处理时间
- 事件频率
- 错误率
- 内存使用情况

### 2. 性能优化

- 事件数量限制 (1000个事件)
- 自动清理过期数据
- 开发环境下的详细日志

## 调试工具

### 1. 数据流调试面板

**访问方式**:
- 开发环境: 点击左上角"调试"按钮
- 快捷键: `Ctrl + Shift + D`

**功能**:
- 实时性能统计
- 时序验证结果
- 最近错误列表
- 事件历史记录

### 2. 控制台日志

开发环境下自动输出详细日志：

```
[DataFlow] camera_start: { timestamp: 1234567890, data: {...} }
[DataFlow] mocap_data_received: { timestamp: 1234567890, data: {...} }
[DataFlow] error_occurred: { timestamp: 1234567890, error: "..." }
```

## API 端点

### 1. S3 预签名 URL

**端点**: `POST /api/s3/presigned-url`

**数据流**:
```
客户端请求 → 参数验证 → S3 预签名生成 → 响应返回
```

**验证规则**:
- 必需参数: `fileName`, `fileType`
- 可选参数: `contentType`
- 错误处理: 参数缺失、S3 错误

## 时序控制

### 1. 操作序列

每个操作都会记录到序列中：

```typescript
dataFlowSequencer.recordOperation('camera_start');
dataFlowSequencer.recordOperation('model_select');
dataFlowSequencer.recordOperation('processing_start');
```

### 2. 时序验证

定期检查操作序列的正确性：

```typescript
const validation = dataFlowSequencer.validateSequence();
if (!validation.isValid) {
  console.error('Sequence validation failed:', validation.issues);
}
```

## 最佳实践

### 1. 数据传递

- 始终使用验证过的数据
- 记录关键操作
- 处理异常情况

### 2. 状态管理

- 使用安全的状态更新函数
- 验证状态转换的合理性
- 及时清理无效状态

### 3. 错误处理

- 统一错误处理机制
- 记录错误详情
- 提供用户友好的错误信息

### 4. 性能优化

- 限制事件数量
- 定期清理过期数据
- 监控关键性能指标

## 故障排除

### 1. 常见问题

**问题**: 状态更新失败
**解决**: 检查状态验证规则，确保数据完整性

**问题**: 时序异常
**解决**: 检查操作序列，确保操作顺序正确

**问题**: 性能下降
**解决**: 检查事件数量，清理过期数据

### 2. 调试步骤

1. 打开数据流调试面板
2. 检查性能统计
3. 查看时序验证结果
4. 分析最近错误
5. 查看事件历史

## 总结

通过完善的数据流监控、验证和时序控制，确保了应用的数据传递正确性、时序合理性和整体健壮性。所有关键操作都经过验证，异常情况得到妥善处理，为应用提供了可靠的运行基础。 
import { MocapData, VTuberState } from '@/types';

// 数据流事件类型
export enum DataFlowEvent {
  CAMERA_START = 'camera_start',
  CAMERA_STOP = 'camera_stop',
  MOCAP_DATA_RECEIVED = 'mocap_data_received',
  MODEL_LOADED = 'model_loaded',
  ANIMATION_LOADED = 'animation_loaded',
  ERROR_OCCURRED = 'error_occurred',
  PROCESSING_START = 'processing_start',
  PROCESSING_END = 'processing_end',
}

// 数据流事件接口
export interface DataFlowEventData {
  event: DataFlowEvent;
  timestamp: number;
  data?: any;
  error?: string;
  duration?: number;
}

// 数据流监控器
export class DataFlowMonitor {
  private events: DataFlowEventData[] = [];
  private isEnabled: boolean = true;
  private maxEvents: number = 1000;

  // 记录事件
  logEvent(event: DataFlowEvent, data?: any, error?: string, duration?: number) {
    if (!this.isEnabled) return;

    const eventData: DataFlowEventData = {
      event,
      timestamp: Date.now(),
      data,
      error,
      duration,
    };

    this.events.push(eventData);

    // 限制事件数量
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DataFlow] ${event}:`, eventData);
    }
  }

  // 获取事件历史
  getEvents(): DataFlowEventData[] {
    return [...this.events];
  }

  // 获取特定类型的事件
  getEventsByType(eventType: DataFlowEvent): DataFlowEventData[] {
    return this.events.filter(event => event.event === eventType);
  }

  // 获取最近的错误
  getRecentErrors(): DataFlowEventData[] {
    return this.events
      .filter(event => event.error)
      .slice(-10);
  }

  // 获取性能统计
  getPerformanceStats() {
    const processingEvents = this.getEventsByType(DataFlowEvent.PROCESSING_START);
    const endEvents = this.getEventsByType(DataFlowEvent.PROCESSING_END);
    
    const durations = processingEvents.map(startEvent => {
      const endEvent = endEvents.find(end => end.timestamp > startEvent.timestamp);
      return endEvent ? endEvent.timestamp - startEvent.timestamp : 0;
    }).filter(duration => duration > 0);

    return {
      totalEvents: this.events.length,
      averageProcessingTime: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      errorCount: this.getRecentErrors().length,
      lastEvent: this.events[this.events.length - 1],
    };
  }

  // 启用/禁用监控
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // 清空事件历史
  clear() {
    this.events = [];
  }
}

// 全局数据流监控器实例
export const dataFlowMonitor = new DataFlowMonitor();

// 数据流验证器
export class DataFlowValidator {
  // 验证动作捕捉数据
  static validateMocapData(data: MocapData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push('MocapData is null or undefined');
      return { isValid: false, errors };
    }

    if (!data.face || !data.pose || !data.hands) {
      errors.push('Missing required mocap data components');
    }

    if (data.timestamp && data.timestamp < 0) {
      errors.push('Invalid timestamp');
    }

    if (data.face) {
      if (!Array.isArray(data.face.landmarks)) {
        errors.push('Face landmarks must be an array');
      }
      if (!Array.isArray(data.face.rotation) || data.face.rotation.length !== 3) {
        errors.push('Face rotation must be an array of 3 numbers');
      }
    }

    if (data.pose) {
      if (!Array.isArray(data.pose.landmarks)) {
        errors.push('Pose landmarks must be an array');
      }
      if (data.pose.confidence < 0 || data.pose.confidence > 1) {
        errors.push('Pose confidence must be between 0 and 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 验证状态更新
  static validateStateUpdate(prevState: VTuberState, newState: Partial<VTuberState>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查摄像头状态转换
    if (newState.isCameraActive !== undefined && prevState.isCameraActive !== newState.isCameraActive) {
      // 摄像头开启时，确保没有错误
      if (newState.isCameraActive && prevState.error) {
        errors.push('Cannot activate camera while error exists');
      }
    }

    // 检查处理状态
    if (newState.isProcessing !== undefined) {
      if (newState.isProcessing && !prevState.isCameraActive) {
        errors.push('Cannot start processing without active camera');
      }
    }

    // 检查模型选择
    if (newState.selectedModel && !newState.selectedModel.url) {
      errors.push('Selected model must have a valid URL');
    }

    // 检查动画选择
    if (newState.selectedAnimation && !newState.selectedAnimation.url) {
      errors.push('Selected animation must have a valid URL');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// 数据流时序管理器
export class DataFlowSequencer {
  private sequence: string[] = [];
  private maxSequenceLength: number = 100;

  // 记录操作序列
  recordOperation(operation: string) {
    this.sequence.push(operation);
    
    if (this.sequence.length > this.maxSequenceLength) {
      this.sequence = this.sequence.slice(-this.maxSequenceLength);
    }
  }

  // 获取操作序列
  getSequence(): string[] {
    return [...this.sequence];
  }

  // 检查时序是否正确
  validateSequence(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // 检查摄像头操作时序
    const cameraStarts = this.sequence.filter(op => op.includes('camera_start'));
    const cameraStops = this.sequence.filter(op => op.includes('camera_stop'));

    if (cameraStops.length > cameraStarts.length) {
      issues.push('Camera stopped more times than started');
    }

    // 检查处理操作时序
    const processingStarts = this.sequence.filter(op => op.includes('processing_start'));
    const processingEnds = this.sequence.filter(op => op.includes('processing_end'));

    if (processingEnds.length > processingStarts.length) {
      issues.push('Processing ended more times than started');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // 清空序列
  clear() {
    this.sequence = [];
  }
}

// 全局时序管理器实例
export const dataFlowSequencer = new DataFlowSequencer(); 
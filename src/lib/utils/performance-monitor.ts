/**
 * 性能监控工具函数
 * 
 * 从 VRMAvatar.tsx 提取的性能监控工具
 * 用于监控 MediaPipe 回调的执行时间
 */

/**
 * 创建性能监控器
 * 
 * @param name 监控器名称
 * @returns 性能监控器对象，包含 checkpoint 和 end 方法
 */
export function createPerformanceMonitor(name: string) {
    const startTime = performance.now();
    return {
        checkpoint: (checkpointName: string) => {
            const currentTime = performance.now();
            const duration = currentTime - startTime;
            if (duration > 5) { // 只记录超过5ms的检查点
                // console.warn(`性能监控 [${name}]: ${checkpointName} 耗时 ${duration.toFixed(2)}ms`);
            }
            return duration;
        },
        end: () => {
            const totalTime = performance.now() - startTime;
            if (totalTime > 12) { // 只记录超过12ms的总时间
                // console.warn(`性能监控 [${name}]: 总耗时 ${totalTime.toFixed(2)}ms`);
            }
            return totalTime;
        }
    };
}






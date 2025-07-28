import { useVideoRecognition } from '@/hooks/useVideoRecognition';

export const UI = () => {
    const { isCameraActive, error } = useVideoRecognition();

    return (
        <section className="fixed inset-0 z-10 pointer-events-none">
            {/* Logo 区域 - 移到左上角，更小 */}
            <div className="absolute top-2 left-2 pointer-events-auto">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-vtuber-primary to-vtuber-secondary rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">VT</span>
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-vtuber-text font-bold text-sm">VTuber Mocap</h1>
                        <p className="text-vtuber-text-light text-xs">Motion Capture</p>
                    </div>
                </div>
            </div>

            {/* 状态指示器 - 移到右上角，更小 */}
            <div className="absolute top-2 right-2 pointer-events-auto">
                <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 shadow-lg border border-vtuber-blue-200">
                    <div className={`w-2 h-2 rounded-full ${isCameraActive
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-gray-400'
                        }`}></div>
                    <span className="text-vtuber-text text-xs font-medium">
                        {isCameraActive ? 'Active' : 'Off'}
                    </span>
                </div>
            </div>

            {/* 错误提示 - 移到顶部中央 */}
            {error && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                    <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-lg border border-red-400 animate-fade-in-down">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium">{error}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 使用说明 - 移到左下角，更小 */}
            <div className="absolute bottom-2 left-2 pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-md rounded-lg p-2 shadow-lg border border-vtuber-blue-200 max-w-xs">
                    <h3 className="text-vtuber-text font-semibold text-xs mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-vtuber-primary rounded-full mr-1"></span>
                        使用说明
                    </h3>
                    <ul className="space-y-0.5 text-xs text-vtuber-text-light">
                        <li>• 点击右下角按钮开启摄像头</li>
                        <li>• 确保光线充足，面部清晰可见</li>
                        <li>• 保持距离摄像头 50-100cm</li>
                    </ul>
                </div>
            </div>

            {/* 性能提示 - 移到右下角，更小 */}
            <div className="absolute bottom-2 right-2 pointer-events-auto">
                <div className="bg-gradient-to-r from-vtuber-primary/10 to-vtuber-secondary/10 backdrop-blur-md rounded-lg p-2 border border-vtuber-blue-200">
                    <div className="flex items-center space-x-1 text-vtuber-text">
                        <div className="w-2 h-2 bg-vtuber-accent rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">
                            {isCameraActive ? 'AI Processing...' : 'Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 装饰元素 - 减少数量和大小 */}
            <div className="absolute top-1/4 right-4 opacity-10 animate-float animation-delay-500">
                <div className="w-8 h-8 border border-vtuber-primary rounded-full"></div>
            </div>

            <div className="absolute bottom-1/4 left-4 opacity-10 animate-float animation-delay-1000">
                <div className="w-4 h-4 bg-vtuber-secondary rounded-full"></div>
            </div>
        </section>
    );
};
import { useVideoRecognition } from '@/hooks/useVideoRecognition';

export const UI = ({ 
    isCameraActive, 
    onOpenModelManager, 
    onOpenAnimationLibrary, 
    onToggleBones, 
    showBones, 
    selectedModel, 
    selectedAnimation,
    showAnimationDebug, // 新增：动画调试面板状态
    onToggleAnimationDebug // 新增：切换动画调试面板
}) => {
    const { error } = useVideoRecognition();

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

            {/* 控制按钮区域 - 移到右下角 */}
            <div className="absolute bottom-4 right-4 pointer-events-auto">
                <div className="flex flex-col space-y-2">
                    {/* 模型管理按钮 */}
                    <button
                        onClick={onOpenModelManager}
                        className="bg-vtuber-primary hover:bg-vtuber-secondary text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                        title="管理模型"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </button>

                    {/* 动画库按钮 */}
                    <button
                        onClick={onOpenAnimationLibrary}
                        className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
                        title="动画库"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* 骨骼显示按钮 */}
                    <button
                        onClick={onToggleBones}
                        className={`p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
                            showBones 
                                ? 'bg-vtuber-accent text-white' 
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                        title={showBones ? '隐藏骨骼' : '显示骨骼'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* 动画调试面板按钮 */}
                    <button
                        onClick={onToggleAnimationDebug}
                        className={`p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
                            showAnimationDebug 
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                        title={showAnimationDebug ? '隐藏动画调试' : '显示动画调试'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 当前状态显示 - 移到左下角 */}
            <div className="absolute bottom-4 left-4 pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-md rounded-lg p-3 shadow-lg border border-vtuber-blue-200 max-w-xs">
                    <h3 className="text-vtuber-text font-semibold text-xs mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-vtuber-primary rounded-full mr-1"></span>
                        当前状态
                    </h3>
                    <div className="space-y-1 text-xs text-vtuber-text-light">
                        <div className="flex justify-between">
                            <span>模型:</span>
                            <span className="font-medium text-vtuber-text">
                                {selectedModel?.name || '默认模型'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>动画:</span>
                            <span className="font-medium text-vtuber-text">
                                {selectedAnimation?.name || '待机动画'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>骨骼:</span>
                            <span className={`font-medium ${showBones ? 'text-green-600' : 'text-gray-500'}`}>
                                {showBones ? '显示' : '隐藏'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 使用说明 - 移到左下角，更小 */}
            <div className="absolute bottom-32 left-4 pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-md rounded-lg p-2 shadow-lg border border-vtuber-blue-200 max-w-xs">
                    <h3 className="text-vtuber-text font-semibold text-xs mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-vtuber-primary rounded-full mr-1"></span>
                        使用说明
                    </h3>
                    <ul className="space-y-0.5 text-xs text-vtuber-text-light">
                        <li>• 点击右下角按钮开启摄像头</li>
                        <li>• 确保光线充足，面部清晰可见</li>
                        <li>• 保持距离摄像头 50-100cm</li>
                        <li>• 使用按钮管理模型和动画</li>
                    </ul>
                </div>
            </div>

            {/* 性能提示 - 移到右下角，更小 */}
            <div className="absolute bottom-32 right-4 pointer-events-auto">
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
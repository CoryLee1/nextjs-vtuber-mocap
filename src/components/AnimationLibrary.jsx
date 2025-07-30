import { useState } from 'react';
import { AnimationCard } from './AnimationCard';
import { FileUploader } from './FileUploader';
import { useAnimationLibrary } from '@/hooks/useAnimationLibrary';

export const AnimationLibrary = ({ isOpen, onClose, onAnimationSelect }) => {
    const [activeTab, setActiveTab] = useState('local');

    const {
        getAllAnimations,
        getSelectedAnimation,
        onlineAnimations,
        isUploading,
        downloadingIds,
        error,
        uploadAnimation,
        downloadAnimation,
        deleteAnimation,
        selectAnimation,
        clearError,
        getCategories
    } = useAnimationLibrary();

    // 处理动画选择
    const handleAnimationSelect = (animation) => {
        console.log('AnimationLibrary: handleAnimationSelect 被调用', animation.name, animation.url);
        selectAnimation(animation);
        onAnimationSelect(animation);
        console.log('AnimationLibrary: 动画选择完成');
    };

    // 处理文件上传
    const handleFileUpload = async (file) => {
        try {
            const newAnimation = await uploadAnimation(file);
            onAnimationSelect(newAnimation);
        } catch (error) {
            // 错误已在 hook 中处理
        }
    };

    // 处理动画下载
    const handleAnimationDownload = async (onlineAnimation) => {
        try {
            const downloadedAnimation = await downloadAnimation(onlineAnimation);
            onAnimationSelect(downloadedAnimation);
        } catch (error) {
            // 错误已在 hook 中处理
        }
    };

    if (!isOpen) return null;

    const selectedAnimation = getSelectedAnimation();
    const allAnimations = getAllAnimations();
    const categories = getCategories();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-vtuber-text">动画库</h2>
                        <p className="text-sm text-vtuber-text-light mt-1">
                            管理你的 Mixamo 动画文件
                        </p>
                        {selectedAnimation && (
                            <div className="mt-2 text-sm text-vtuber-primary">
                                当前动画: <span className="font-semibold">{selectedAnimation.name}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* 标签页导航 */}
                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'local', label: '我的动画', icon: '💻' },
                        { id: 'upload', label: '上传动画', icon: '📤' },
                        { id: 'download', label: '在线动画', icon: '🌐' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'text-vtuber-primary border-b-2 border-vtuber-primary bg-vtuber-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 内容区域 */}
                <div className="p-6 overflow-y-auto max-h-[55vh]">
                    {/* 本地动画标签页 */}
                    {activeTab === 'local' && (
                        <div>
                            {allAnimations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">🎬</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                                        暂无动画
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        请上传或下载动画文件
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {/* 分类筛选 */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setActiveTab('local')}
                                                className="px-3 py-1 text-xs bg-vtuber-primary text-white rounded-full"
                                            >
                                                全部 ({allAnimations.length})
                                            </button>
                                            {categories.map(category => {
                                                const count = allAnimations.filter(anim => anim.category === category).length;
                                                return (
                                                    <button
                                                        key={category}
                                                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
                                                    >
                                                        {category} ({count})
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 动画网格 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {allAnimations.map(animation => (
                                            <AnimationCard
                                                key={animation.id}
                                                animation={animation}
                                                onSelect={handleAnimationSelect}
                                                onDelete={deleteAnimation}
                                                isSelected={selectedAnimation?.id === animation.id}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 上传动画标签页 */}
                    {activeTab === 'upload' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-vtuber-text mb-2">
                                    上传动画文件
                                </h3>
                                <p className="text-vtuber-text-light text-sm">
                                    支持上传 Mixamo 导出的 .fbx 动画文件
                                </p>
                            </div>

                            <FileUploader
                                onUpload={handleFileUpload}
                                isUploading={isUploading}
                                accept=".fbx"
                                title="拖拽动画文件到此处或点击上传"
                                description="支持 .fbx 格式，最大 50MB"
                            />
                        </div>
                    )}

                    {/* 在线动画标签页 */}
                    {activeTab === 'download' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-vtuber-text mb-2">
                                    在线动画库
                                </h3>
                                <p className="text-vtuber-text-light text-sm">
                                    下载高质量的 Mixamo 动画到本地使用
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {onlineAnimations.map(animation => (
                                    <AnimationCard
                                        key={animation.id}
                                        animation={animation}
                                        onSelect={handleAnimationSelect}
                                        onDownload={handleAnimationDownload}
                                        isDownloading={downloadingIds.has(animation.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部信息 */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <div>
                            <span className="font-medium">💡 提示:</span>
                            <span className="ml-2">动画文件会自动适配到当前VRM模型</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span>📁 支持格式: FBX</span>
                            <span>📏 最大大小: 50MB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 
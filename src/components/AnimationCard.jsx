import { useState } from 'react';

export const AnimationCard = ({ 
    animation, 
    onSelect, 
    onDelete, 
    isSelected = false,
    isDownloading = false 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleSelect = () => {
        if (onSelect) {
            onSelect(animation);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (onDelete && !animation.isDefault) {
            onDelete(animation.id);
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            idle: 'bg-blue-100 text-blue-800',
            dance: 'bg-purple-100 text-purple-800',
            movement: 'bg-green-100 text-green-800',
            custom: 'bg-orange-100 text-orange-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            idle: '🛌',
            dance: '💃',
            movement: '🚶',
            custom: '📁'
        };
        return icons[category] || '🎬';
    };

    return (
        <div
            className={`
                relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
                ${isSelected 
                    ? 'border-vtuber-primary shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-vtuber-primary hover:shadow-md'
                }
                ${isDownloading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleSelect}
        >
            {/* 选中指示器 */}
            {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-vtuber-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    ✓
                </div>
            )}

            {/* 下载状态指示器 */}
            {isDownloading && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* 删除按钮 */}
            {!animation.isDefault && onDelete && (
                <button
                    onClick={handleDelete}
                    className={`
                        absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full 
                        flex items-center justify-center text-xs font-bold transition-opacity
                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}
                    title="删除动画"
                >
                    ✕
                </button>
            )}

            {/* 内容 */}
            <div className="p-4">
                {/* 头部 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                            {animation.name}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-2">
                            {animation.description}
                        </p>
                    </div>
                </div>

                {/* 分类标签 */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(animation.category)}`}>
                        <span className="mr-1">{getCategoryIcon(animation.category)}</span>
                        {animation.category}
                    </span>
                    {animation.size && (
                        <span className="text-xs text-gray-500">
                            {animation.size}
                        </span>
                    )}
                </div>

                {/* 文件信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                        <span className="mr-1">📁</span>
                        {animation.type?.toUpperCase()}
                    </span>
                    {animation.isDefault && (
                        <span className="text-vtuber-primary font-medium">默认</span>
                    )}
                    {animation.isCustom && (
                        <span className="text-orange-500 font-medium">自定义</span>
                    )}
                    {animation.isDownloaded && (
                        <span className="text-green-500 font-medium">已下载</span>
                    )}
                </div>

                {/* 预览区域 */}
                {animation.preview && (
                    <div className="mt-3 bg-gray-100 rounded-lg h-20 flex items-center justify-center">
                        <img 
                            src={animation.preview} 
                            alt={animation.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="hidden items-center justify-center text-gray-400">
                            <span className="text-2xl">🎬</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 选择按钮 */}
            {!isSelected && (
                <div className="px-4 pb-4">
                    <button
                        onClick={handleSelect}
                        className="w-full bg-vtuber-primary text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-vtuber-secondary transition-colors"
                    >
                        选择动画
                    </button>
                </div>
            )}
        </div>
    );
}; 
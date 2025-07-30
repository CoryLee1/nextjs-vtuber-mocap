import React, { useState } from 'react';
import { useAnimationLibrary } from '@/hooks/useAnimationLibrary';
import { AnimationCard } from './AnimationCard';
import { DraggablePanel } from './DraggablePanel';

export const AnimationLibrary = ({ isOpen, onClose, onAnimationSelect }) => {
    const { animations, getSelectedAnimation, selectAnimation } = useAnimationLibrary();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const selectedAnimation = getSelectedAnimation();

    // 过滤动画 - 添加安全检查
    const filteredAnimations = (animations || []).filter(animation => {
        const matchesSearch = animation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            animation.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || animation.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // 获取所有分类 - 添加安全检查
    const categories = ['all', ...new Set((animations || []).map(animation => animation.category))];

    return (
        <DraggablePanel
            title="🎬 动画库"
            defaultPosition={{ x: 100, y: 100 }}
            minWidth={450}
            minHeight={500}
            maxWidth={900}
            maxHeight={700}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={70}
        >
            <div className="p-4 h-full flex flex-col">
                {/* 搜索和筛选 */}
                <div className="mb-4 space-y-3">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="搜索动画..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? '所有分类' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>找到 {filteredAnimations.length} 个动画</span>
                        {selectedAnimation && (
                            <span className="text-purple-600">
                                当前: {selectedAnimation.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* 动画列表 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAnimations.map((animation) => (
                            <AnimationCard
                                key={animation.id}
                                animation={animation}
                                isSelected={selectedAnimation?.id === animation.id}
                                onSelect={() => {
                                    selectAnimation(animation);
                                    onAnimationSelect(animation);
                                }}
                            />
                        ))}
                    </div>
                    
                    {filteredAnimations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>没有找到匹配的动画</p>
                            <p className="text-sm">尝试调整搜索条件</p>
                        </div>
                    )}
                </div>

                {/* 底部信息 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>支持 FBX 格式</span>
                        <span>点击动画卡片选择</span>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
}; 
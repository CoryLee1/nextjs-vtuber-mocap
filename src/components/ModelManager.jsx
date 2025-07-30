import React, { useState, useEffect } from 'react';
import { useModelManager } from '@/hooks/useModelManager';
import { ModelCard } from './ModelCard';
import { DraggablePanel } from './DraggablePanel';

export const ModelManager = ({ isOpen, onClose, onModelSelect }) => {
    const { getAllModels, getSelectedModel, selectModel } = useModelManager();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const selectedModel = getSelectedModel();
    const models = getAllModels(); // 获取所有模型

    // 过滤模型 - 添加安全检查
    const filteredModels = (models || []).filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (model.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // 获取所有分类 - 添加安全检查
    const categories = ['all', ...new Set((models || []).map(model => model.category).filter(Boolean))];

    return (
        <DraggablePanel
            title="🎭 模型管理器"
            defaultPosition={{ x: 50, y: 50 }}
            minWidth={400}
            minHeight={500}
            maxWidth={800}
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
                            placeholder="搜索模型..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? '所有分类' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>找到 {filteredModels.length} 个模型</span>
                        {selectedModel && (
                            <span className="text-blue-600">
                                当前: {selectedModel.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* 模型列表 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredModels.map((model) => (
                            <ModelCard
                                key={model.id}
                                model={model}
                                isSelected={selectedModel?.id === model.id}
                                onSelect={() => {
                                    selectModel(model.id);
                                    onModelSelect(model);
                                }}
                            />
                        ))}
                    </div>
                    
                    {filteredModels.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                            </svg>
                            <p>没有找到匹配的模型</p>
                            <p className="text-sm">尝试调整搜索条件</p>
                        </div>
                    )}
                </div>

                {/* 底部信息 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>支持 VRM 格式</span>
                        <span>点击模型卡片选择</span>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
};
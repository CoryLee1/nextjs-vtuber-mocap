import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { getModels } from '@/utils/resourceManager';

export const ModelManager = ({ isOpen, onClose, onModelSelect }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 加载模型
  useEffect(() => {
    const loadModels = async () => {
      setLoading(true);
      try {
        const data = await getModels();
        setModels(data || []);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  // 搜索模型
  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) {
        const data = await getModels();
        setModels(data || []);
        return;
      }

      setLoading(true);
      try {
        const results = await getModels();
        const filtered = results.filter(model => 
          model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setModels(filtered);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 过滤模型
  const filteredModels = models.filter(model => {
    if (selectedCategory === 'all') return true;
    return model.category === selectedCategory;
  });

  // 获取分类列表
  const categories = ['all', ...new Set(models.map(m => m.category))];

  // 处理模型选择
  const handleModelSelect = (model) => {
    onModelSelect(model);
    onClose();
  };

  return (
    <DraggablePanel
      title="🎭 模型管理器"
      defaultPosition={{ x: 200, y: 200 }}
      minWidth={600}
      minHeight={500}
      maxWidth={800}
      maxHeight={700}
      isVisible={isOpen}
      onClose={onClose}
      showToggle={false}
      showClose={true}
      zIndex={85}
    >
      <div className="p-4 h-full flex flex-col">
        {/* 搜索和过滤 */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="搜索模型..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部分类' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 模型列表 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-gray-500 text-center">
                <div>正在加载模型列表...</div>
                <div className="text-xs text-gray-400 mt-1">
                  从 GitHub Releases 获取资源信息
                </div>
              </div>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 text-center">
                <div>没有找到模型</div>
                {searchTerm && (
                  <div className="text-sm text-gray-400 mt-1">
                    搜索: &quot;{searchTerm}&quot;
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all"
                >
                  {/* 缩略图 */}
                  <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                    {model.thumbnail ? (
                      <img
                        src={model.thumbnail}
                        alt={model.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🎭</div>
                    )}
                    {/* 备用图标 */}
                    <div className="text-gray-400 text-4xl hidden">🎭</div>
                  </div>

                  {/* 模型信息 */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {model.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{model.category}</span>
                      <span>{model.size}</span>
                    </div>
                    
                    {/* 网络加载提示 */}
                    {model.url.startsWith('http') && (
                      <div className="text-xs text-blue-500 mt-1">
                        🌐 从云端加载
                      </div>
                    )}
                    
                    {/* 标签 */}
                    {model.tags && model.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {model.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {model.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{model.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            共 {filteredModels.length} 个模型
            {searchTerm && ` (搜索: &quot;${searchTerm}&quot;)`}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
};
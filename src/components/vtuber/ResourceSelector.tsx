import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { resourceManager, getModels, getAnimations, searchResources } from '@/lib/resource-manager';

export const ResourceSelector = ({ 
  isOpen, 
  onClose, 
  type = 'models', // 'models' or 'animations'
  onSelect,
  selectedId = null
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 加载资源
  useEffect(() => {
    const loadResources = async () => {
      setLoading(true);
      try {
        let data;
        if (type === 'models') {
          data = await getModels();
        } else if (type === 'animations') {
          data = await getAnimations();
        }
        setResources(data || []);
      } catch (error) {
        console.error('Failed to load resources:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadResources();
    }
  }, [isOpen, type]);

  // 搜索资源
  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) {
        // 重新加载所有资源
        const data = type === 'models' ? await getModels() : await getAnimations();
        setResources(data || []);
        return;
      }

      setLoading(true);
      try {
        const results = await searchResources(searchTerm, type);
        setResources(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, type]);

  // 过滤资源
  const filteredResources = resources.filter(resource => {
    if (selectedCategory === 'all') return true;
    return resource.category === selectedCategory;
  });

  // 获取分类列表
  const categories = ['all', ...new Set(resources.map(r => r.category))];

  // 处理选择
  const handleSelect = (resource) => {
    onSelect(resource);
    onClose();
  };

  // 格式化文件大小
  const formatFileSize = (size) => {
    if (typeof size === 'string') return size;
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <DraggablePanel
      title={`选择${type === 'models' ? '模型' : '动画'}`}
      defaultPosition={{ x: 100, y: 100 }}
      minWidth={600}
      minHeight={500}
      maxWidth={800}
      maxHeight={700}
      isVisible={isOpen}
      onClose={onClose}
      showToggle={false}
      showClose={true}
      zIndex={90}
    >
      <div className="p-4 h-full flex flex-col">
        {/* 搜索和过滤 */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={`搜索${type === 'models' ? '模型' : '动画'}...`}
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

        {/* 资源列表 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">没有找到资源</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleSelect(resource)}
                  className={`
                    relative p-4 border rounded-lg cursor-pointer transition-all
                    ${selectedId === resource.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* 缩略图 */}
                  <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                    {resource.thumbnail ? (
                      <img
                        src={resource.thumbnail}
                        alt={resource.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">
                        {type === 'models' ? '🎭' : '🎬'}
                      </div>
                    )}
                    {/* 备用图标 */}
                    <div className="text-gray-400 text-4xl hidden">
                      {type === 'models' ? '🎭' : '🎬'}
                    </div>
                  </div>

                  {/* 资源信息 */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {resource.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{resource.category}</span>
                      <span>{formatFileSize(resource.size)}</span>
                    </div>
                    
                    {/* 标签 */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resource.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{resource.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 选中指示器 */}
                  {selectedId === resource.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            共 {filteredResources.length} 个{type === 'models' ? '模型' : '动画'}
            {searchTerm && ` (搜索: "${searchTerm}")`}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}; 
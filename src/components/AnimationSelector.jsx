import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { getAnimations } from '@/utils/resourceManager';

export const AnimationSelector = ({ isOpen, onClose, onAnimationSelect }) => {
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 加载动画
  useEffect(() => {
    const loadAnimations = async () => {
      setLoading(true);
      try {
        const data = await getAnimations();
        setAnimations(data || []);
      } catch (error) {
        console.error('Failed to load animations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadAnimations();
    }
  }, [isOpen]);

  // 搜索动画
  useEffect(() => {
    const search = async () => {
      if (!searchTerm.trim()) {
        const data = await getAnimations();
        setAnimations(data || []);
        return;
      }

      setLoading(true);
      try {
        const results = await getAnimations();
        const filtered = results.filter(anim => 
          anim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          anim.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setAnimations(filtered);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // 过滤动画
  const filteredAnimations = animations.filter(anim => {
    if (selectedCategory === 'all') return true;
    return anim.category === selectedCategory;
  });

  // 获取分类列表
  const categories = ['all', ...new Set(animations.map(a => a.category))];

  // 处理动画选择
  const handleAnimationSelect = (animation) => {
    onAnimationSelect(animation);
    onClose();
  };

  return (
    <DraggablePanel
      title="🎬 动画库"
      defaultPosition={{ x: 300, y: 200 }}
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
              placeholder="搜索动画..."
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

        {/* 动画列表 */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <div className="text-gray-500 text-center">
                <div>正在加载动画列表...</div>
                <div className="text-xs text-gray-400 mt-1">
                  从 GitHub Releases 获取资源信息
                </div>
              </div>
            </div>
          ) : filteredAnimations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 text-center">
                <div>没有找到动画</div>
                {searchTerm && (
                  <div className="text-sm text-gray-400 mt-1">
                    搜索: "{searchTerm}"
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnimations.map((animation) => (
                <div
                  key={animation.id}
                  onClick={() => handleAnimationSelect(animation)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-gray-50 transition-all"
                >
                  {/* 缩略图 */}
                  <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center">
                    {animation.thumbnail ? (
                      <img
                        src={animation.thumbnail}
                        alt={animation.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🎬</div>
                    )}
                    {/* 备用图标 */}
                    <div className="text-gray-400 text-4xl hidden">🎬</div>
                  </div>

                  {/* 动画信息 */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {animation.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="capitalize">{animation.category}</span>
                      <span>{animation.size}</span>
                    </div>
                    
                    {/* 网络加载提示 */}
                    {animation.url.startsWith('http') && (
                      <div className="text-xs text-blue-500 mt-1">
                        🌐 从云端加载
                      </div>
                    )}
                    
                    {/* 标签 */}
                    {animation.tags && animation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {animation.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {animation.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{animation.tags.length - 3}
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
            共 {filteredAnimations.length} 个动画
            {searchTerm && ` (搜索: "${searchTerm}")`}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}; 
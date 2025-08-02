import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { 
  configManager, 
  CONFIG_CATEGORIES, 
  CONFIG_DATA_TABLE,
  getConfig,
  setConfig,
  resetCategory,
  resetAllConfig
} from '@/utils/configManager';

export const ConfigManagerPanel = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(CONFIG_CATEGORIES.SENSITIVITY);
  const [configValues, setConfigValues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 加载当前配置值
  useEffect(() => {
    const values = {};
    Object.keys(CONFIG_DATA_TABLE).forEach(category => {
      values[category] = {};
      Object.keys(CONFIG_DATA_TABLE[category]).forEach(key => {
        values[category][key] = getConfig(category, key);
      });
    });
    setConfigValues(values);
  }, []);

  // 处理配置值变化
  const handleConfigChange = (category, key, value) => {
    setConfig(category, key, value);
    setConfigValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // 重置分类
  const handleResetCategory = (category) => {
    resetCategory(category);
    const values = {};
    Object.keys(CONFIG_DATA_TABLE[category]).forEach(key => {
      values[key] = getConfig(category, key);
    });
    setConfigValues(prev => ({
      ...prev,
      [category]: values
    }));
  };

  // 导出配置
  const handleExportConfig = () => {
    const configString = configManager.exportConfig();
    const blob = new Blob([configString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vtuber-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const handleImportConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = configManager.importConfig(e.target.result);
        if (success) {
          // 重新加载所有配置值
          const values = {};
          Object.keys(CONFIG_DATA_TABLE).forEach(category => {
            values[category] = {};
            Object.keys(CONFIG_DATA_TABLE[category]).forEach(key => {
              values[category][key] = getConfig(category, key);
            });
          });
          setConfigValues(values);
          alert('配置导入成功！');
        } else {
          alert('配置导入失败，请检查文件格式！');
        }
      };
      reader.readAsText(file);
    }
  };

  // 渲染配置项
  const renderConfigItem = (category, key, metadata) => {
    const value = configValues[category]?.[key];
    const displayValue = value !== undefined ? value : metadata.value;

    switch (metadata.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={displayValue}
              onChange={(e) => handleConfigChange(category, key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">{displayValue ? '启用' : '禁用'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={displayValue}
            onChange={(e) => handleConfigChange(category, key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {metadata.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'integer':
      case 'float':
        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <input
                type="number"
                min={metadata.min}
                max={metadata.max}
                step={metadata.step}
                value={displayValue}
                onChange={(e) => handleConfigChange(category, key, parseFloat(e.target.value))}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-xs text-gray-500">
                {metadata.min} - {metadata.max}
              </span>
            </div>
            <input
              type="range"
              min={metadata.min}
              max={metadata.max}
              step={metadata.step}
              value={displayValue}
              onChange={(e) => handleConfigChange(category, key, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        );

      case 'object':
        return (
          <div className="text-xs text-gray-500">
            {JSON.stringify(displayValue)}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleConfigChange(category, key, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  // 过滤配置项
  const filteredCategories = Object.keys(CONFIG_DATA_TABLE).filter(category => {
    if (!searchTerm) return true;
    return category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           Object.keys(CONFIG_DATA_TABLE[category]).some(key => 
             CONFIG_DATA_TABLE[category][key].description.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  return (
    <DraggablePanel
      title="⚙️ 配置管理器"
      defaultPosition={{ x: 50, y: 50 }}
      minWidth={800}
      minHeight={600}
      maxWidth={1200}
      maxHeight={800}
      isVisible={isOpen}
      onClose={onClose}
      showToggle={false}
      showClose={true}
      zIndex={100}
    >
      <div className="p-4 h-full flex flex-col">
        {/* 工具栏 */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="搜索配置项..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">高级模式</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportConfig}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                导出配置
              </button>
              <label className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
                导入配置
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  if (confirm('确定要重置所有配置吗？')) {
                    resetAllConfig();
                    window.location.reload();
                  }
                }}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                重置全部
              </button>
            </div>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {filteredCategories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 配置表格 */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    配置项
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前值
                  </th>
                  {showAdvanced && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.keys(CONFIG_DATA_TABLE[activeCategory] || {}).map(key => {
                  const metadata = CONFIG_DATA_TABLE[activeCategory][key];
                  return (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {metadata.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderConfigItem(activeCategory, key, metadata)}
                      </td>
                      {showAdvanced && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {metadata.type}
                          {metadata.category && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
                              {metadata.category}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            const defaultValue = metadata.value;
                            handleConfigChange(activeCategory, key, defaultValue);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          重置
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分类操作 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              当前分类: {activeCategory} ({Object.keys(CONFIG_DATA_TABLE[activeCategory] || {}).length} 项)
            </div>
            <button
              onClick={() => handleResetCategory(activeCategory)}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              重置当前分类
            </button>
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}; 
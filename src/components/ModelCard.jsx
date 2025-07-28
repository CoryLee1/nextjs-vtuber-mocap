// 本地模型卡片组件
export const ModelCard = ({ model, onSelect, onDelete, isSelected = false }) => {
    return (
      <div className={`bg-white rounded-lg p-4 border-2 transition-all duration-200 hover:shadow-md ${
        isSelected ? 'border-vtuber-primary shadow-lg' : 'border-gray-200'
      }`}>
        {/* 模型预览图 */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
          <img
            src={model.thumbnail}
            alt={model.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/images/1111.jpg';
            }}
          />
          {isSelected && (
            <div className="absolute top-2 right-2 bg-vtuber-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
              ✓
            </div>
          )}
        </div>
        
        {/* 模型信息 */}
        <div className="mb-3">
          <h4 className="font-medium text-vtuber-text mb-1 truncate" title={model.name}>
            {model.name}
          </h4>
          
          <div className="text-xs text-vtuber-text-light space-y-1">
            {model.size && <p>📦 大小: {model.size}</p>}
            {model.uploadDate && <p>📅 上传: {model.uploadDate}</p>}
            {model.downloadDate && <p>📥 下载: {model.downloadDate}</p>}
            {model.isDefault && <p>🏷️ 默认模型</p>}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelect(model)}
            className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
              isSelected
                ? 'bg-vtuber-primary text-white'
                : 'bg-vtuber-blue-100 text-vtuber-primary hover:bg-vtuber-blue-200'
            }`}
          >
            {isSelected ? '已选择' : '使用'}
          </button>
          
          {onDelete && !model.isDefault && (
            <button
              onClick={() => onDelete(model.id)}
              className="bg-red-100 text-red-600 text-sm py-2 px-3 rounded hover:bg-red-200 transition-colors"
              title="删除模型"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    );
  };
  
  // 在线模型卡片组件
  export const OnlineModelCard = ({ model, onDownload, isDownloading = false }) => {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
        {/* 模型预览图 */}
        <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
          <img
            src={model.thumbnail}
            alt={model.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/images/1111.jpg';
            }}
          />
        </div>
        
        {/* 模型信息 */}
        <div className="mb-3">
          <h4 className="font-medium text-vtuber-text mb-1" title={model.name}>
            {model.name}
          </h4>
          
          <div className="text-xs text-vtuber-text-light space-y-1">
            <p>👤 作者: {model.author}</p>
            <p>📦 大小: {model.size}</p>
            {model.description && <p>📝 {model.description}</p>}
          </div>
        </div>
        
        {/* 下载按钮 */}
        <button
          onClick={() => onDownload(model)}
          disabled={isDownloading}
          className="w-full bg-vtuber-primary text-white text-sm py-2 px-3 rounded hover:bg-vtuber-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
              下载中...
            </div>
          ) : (
            '📥 下载'
          )}
        </button>
      </div>
    );
  };
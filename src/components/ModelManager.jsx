import { useState } from 'react';
import { ModelCard, OnlineModelCard } from './ModelCard';
import { FileUploader } from './FileUploader';
import { useModelManager } from '@/hooks/useModelManager';

export const ModelManager = ({ isOpen, onClose, onModelSelect }) => {
    const [activeTab, setActiveTab] = useState('local');

    const {
        getAllModels,
        getSelectedModel,
        onlineModels,
        isUploading,
        downloadingIds,
        error,
        uploadModel,
        downloadModel,
        deleteModel,
        selectModel,
        clearError,
    } = useModelManager();

    // 处理模型选择
    const handleModelSelect = (model) => {
        console.log('ModelManager: handleModelSelect 被调用', model.name, model.url);
        selectModel(model.id);
        onModelSelect(model.url);
        console.log('ModelManager: 模型选择完成');
    };

    // 处理文件上传
    const handleFileUpload = async (file) => {
        try {
            const newModel = await uploadModel(file);
            onModelSelect(newModel.url);
        } catch (error) {
            // 错误已在 hook 中处理
        }
    };

    // 处理模型下载
    const handleModelDownload = async (onlineModel) => {
        try {
            const downloadedModel = await downloadModel(onlineModel);
            onModelSelect(downloadedModel.url);
        } catch (error) {
            // 错误已在 hook 中处理
        }
    };

    if (!isOpen) return null;

    const selectedModel = getSelectedModel();
    const allModels = getAllModels();

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-vtuber-text">模型管理</h2>
                        <p className="text-sm text-vtuber-text-light mt-1">
                            管理你的 VRM 虚拟形象模型
                        </p>
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
                        { id: 'local', label: '我的模型', icon: '💻' },
                        { id: 'upload', label: '上传模型', icon: '📤' },
                        { id: 'download', label: '在线模型', icon: '🌐' },
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
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {/* 本地模型标签页 */}
                    {activeTab === 'local' && (
                        <div>
                            {allModels.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">📂</span>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                                        暂无模型
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        请上传或下载 VRM 模型
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allModels.map(model => (
                                        <ModelCard
                                            key={model.id}
                                            model={model}
                                            onSelect={handleModelSelect}
                                            onDelete={!model.isDefault ? deleteModel : null}
                                            isSelected={selectedModel.id === model.id}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 上传模型标签页 */}
                    {activeTab === 'upload' && (
                        <FileUploader
                            onUpload={handleFileUpload}
                            isUploading={isUploading}
                            accept=".vrm"
                        />
                    )}

                    {/* 在线模型标签页 */}
                    {activeTab === 'download' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-vtuber-text mb-2">
                                    在线模型库
                                </h3>
                                <p className="text-vtuber-text-light text-sm">
                                    下载高质量的 VRM 模型到本地使用
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {onlineModels.map(model => (
                                    <OnlineModelCard
                                        key={model.id}
                                        model={model}
                                        onDownload={handleModelDownload}
                                        isDownloading={downloadingIds.has(model.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);
};
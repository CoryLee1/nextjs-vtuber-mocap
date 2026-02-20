import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  Search, 
  Filter, 
  Plus, 
  File, 
  Globe,
  Loader2,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getModels } from '@/lib/resource-manager';
import { VRMModel } from '@/types';
import { useI18n } from '@/hooks/use-i18n';
import { useTracking } from '@/hooks/use-tracking';
import { s3Uploader } from '@/lib/s3-uploader';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';
import { backfillVrmThumbnails } from '@/lib/backfill-vrm-thumbnails';
import { generateVrmThumbnailBlob } from '@/lib/vrm-thumbnail-render';

interface ModelManagerProps {
  onClose: () => void;
  onSelect: (model: VRMModel) => void;
  /** 打开时自动弹出上传对话框（如从引导页「上传模型」进入） */
  initialOpenUpload?: boolean;
  /** 消费完 initialOpenUpload 后调用，便于父组件清除状态 */
  onInitialOpenUploadConsumed?: () => void;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ onClose, onSelect, initialOpenUpload, onInitialOpenUploadConsumed }) => {
  const { t } = useI18n();
  const { trackFeatureUsed, trackError } = useTracking();
  const [models, setModels] = useState<VRMModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillStatus, setBackfillStatus] = useState<string | null>(null);
  /** 缩略图加载失败时客户端生成的证件照 blob URL */
  const [clientThumbnails, setClientThumbnails] = useState<Record<string, string>>({});
  const clientThumbnailsRef = useRef(clientThumbnails);
  clientThumbnailsRef.current = clientThumbnails;

  // 从引导页「上传模型」进入时自动打开上传对话框
  useEffect(() => {
    if (initialOpenUpload) {
      setUploadDialogOpen(true);
      onInitialOpenUploadConsumed?.();
    }
  }, [initialOpenUpload, onInitialOpenUploadConsumed]);

  // 卸载时撤销客户端生成的缩略图 blob URL
  useEffect(() => {
    return () => {
      Object.values(clientThumbnailsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // 加载模型：优先用 Loading 阶段预拉的 S3 缓存，再刷新
  useEffect(() => {
    const merge = (local: VRMModel[], s3: VRMModel[]) => {
      const all = [...local];
      const ids = new Set(local.map(m => m.id));
      s3.forEach(m => { if (!ids.has(m.id)) { ids.add(m.id); all.push(m); } });
      return all;
    };

    const loadModels = async () => {
      setLoading(true);
      try {
        const localModels = await getModels(undefined) || [];
        const store = useS3ResourcesStore.getState();
        if (store.modelsLoaded && store.s3Models.length >= 0) {
          setModels(merge(localModels, store.s3Models));
        }
        setLoading(false);
        await store.loadModels();
        const s3Models = useS3ResourcesStore.getState().s3Models;
        setModels(merge(localModels, s3Models));
        trackFeatureUsed('models_loaded', 'model_management');
      } catch (error) {
        console.error('Failed to load models:', error);
        trackError('model_load_error', error.toString(), 'model_manager');
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, [trackFeatureUsed, trackError]);

  // 搜索模型（使用缓存 S3 列表）
  useEffect(() => {
    const merge = (local: VRMModel[], s3: VRMModel[]) => {
      const all = [...local];
      const ids = new Set(local.map(m => m.id));
      s3.forEach(m => { if (!ids.has(m.id)) { ids.add(m.id); all.push(m); } });
      return all;
    };

    const search = async () => {
      const localModels = await getModels(undefined) || [];
      const s3Models = useS3ResourcesStore.getState().s3Models;

      if (!searchTerm.trim()) {
        setModels(merge(localModels, s3Models));
        return;
      }

      setLoading(true);
      try {
        const allModels = merge(localModels, s3Models);
        const filtered = allModels.filter(model =>
          model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (model.tags && model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
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
  const handleModelSelect = (model: VRMModel) => {
    trackFeatureUsed('model_selected', 'model_management');
    onSelect(model);
    onClose();
  };

  // 处理文件上传
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];
      
      // 验证每个文件
      fileArray.forEach((file, index) => {
        const validationErrors = s3Uploader.validateVRMFile(file);
      if (validationErrors.length > 0) {
          errors.push(`${file.name}: ${validationErrors.join(', ')}`);
        } else {
          validFiles.push(file);
        }
      });
      
      // 显示错误信息
      if (errors.length > 0) {
        trackError('file_validation_error', errors.join(', '), 'model_manager');
        alert(`以下文件验证失败：\n${errors.join('\n')}`);
      }
      
      // 设置有效文件
      if (validFiles.length > 0) {
        setUploadFiles(validFiles);
        setUploadFile(validFiles[0]); // 保持兼容性
        trackFeatureUsed('files_selected', 'model_upload', validFiles.length);
      }
    }
  };

  // 处理模型上传
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
    setUploadResults([]);

    try {
      trackFeatureUsed('upload_started', 'model_upload', uploadFiles.length);
      const uploadedModels: VRMModel[] = [];
      
      // 逐个上传文件
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setCurrentUploadIndex(i);
        
        console.log(`开始上传VRM模型 ${i + 1}/${uploadFiles.length}:`, file.name);
      
      // 使用S3上传器上传文件
        const uploadResult = await s3Uploader.uploadFile(file, (progress) => {
          // 计算总体进度
          const totalProgress = ((i + progress / 100) / uploadFiles.length) * 100;
          setUploadProgress(totalProgress);
          console.log(`上传进度 ${i + 1}/${uploadFiles.length}:`, progress);
      });

        console.log(`上传完成 ${i + 1}/${uploadFiles.length}:`, uploadResult);
      
        // 创建新的模型对象 - 强制设置为VRM
      const newModel: VRMModel = {
          id: `uploaded-${Date.now()}-${i}`,
          name: file.name.replace('.vrm', ''), // 移除.vrm扩展名
        url: uploadResult.url,
          category: 'vrm', // 强制设置为VRM类别
        thumbnail: null, // 可以后续添加缩略图生成功能
          tags: ['uploaded', 'VRM'], // 强制设置为VRM标签
          description: `用户上传的VRM模型文件`,
        createdAt: new Date().toISOString(),
        size: uploadResult.size,
          type: 'model/vrm' // 强制设置为VRM类型
      };

        uploadedModels.push(newModel);
        setUploadResults(prev => [...prev, { file: file.name, success: true }]);
      }

      // 添加到模型列表
      setModels(prevModels => [...uploadedModels, ...prevModels]);
      trackFeatureUsed('upload_completed', 'model_upload', uploadedModels.length);
      
      // 重新加载S3模型列表
      const loadModels = async () => {
        try {
          const localModels = await getModels(undefined) || [];
          const s3Response = await fetch('/api/s3/resources?type=models');
          let s3Models = [];
          
          if (s3Response.ok) {
            const s3Data = await s3Response.json();
            s3Models = s3Data.data || [];
          }
          
          const allModels = [...localModels];
          const existingIds = new Set(localModels.map(m => m.id));
          
          s3Models.forEach(s3Model => {
            if (!existingIds.has(s3Model.id)) {
              allModels.push(s3Model);
            }
          });
          
          setModels(allModels);
        } catch (error) {
          console.error('Failed to reload models:', error);
        }
      };
      
      loadModels();
      
      // 上传成功后关闭对话框并重置状态
      setUploading(false);
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadFile(null);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
      setUploadResults([]);
      
      // 显示成功消息
      alert(`成功上传 ${uploadedModels.length} 个VRM模型！已添加到模型列表。`);

    } catch (error) {
      console.error('上传失败:', error);
      alert(`上传失败: ${error instanceof Error ? error.message : String(error)}`);
      setUploading(false);
      setCurrentUploadIndex(0);
    }
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      const data = await getModels(undefined);
      setModels(data || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  // 补全 S3 中缺失缩略图的模型（拉列表检查后逐个生成证件照并上传）
  const handleBackfillThumbnails = async () => {
    setBackfilling(true);
    setBackfillStatus('正在检查缺失缩略图的模型…');
    try {
      const { ok, fail } = await backfillVrmThumbnails((p) => {
        setBackfillStatus(`${p.current}/${p.total} ${p.modelName} ${p.success ? '✓' : '✗ ' + (p.error || '')}`);
      });
      setBackfillStatus(null);
      if (ok > 0 || fail > 0) {
        await useS3ResourcesStore.getState().loadModels();
        const localModels = await getModels(undefined) || [];
        const s3Models = useS3ResourcesStore.getState().s3Models;
        const all = [...localModels];
        const ids = new Set(localModels.map((m: VRMModel) => m.id));
        s3Models.forEach((m: VRMModel) => { if (!ids.has(m.id)) { ids.add(m.id); all.push(m); } });
        setModels(all);
      }
      const msg = ok > 0 || fail > 0
        ? `补全完成：成功 ${ok}，失败 ${fail}`
        : '补全完成：当前 S3（vrm/ 目录）中无缺失缩略图的模型，或暂无 .vrm 文件。列表中的「Avatar Sample A/C/H」等为预设模型，其缩略图通过接口从 VRM 内嵌图或占位图显示。';
      alert(msg);
    } catch (e) {
      setBackfillStatus(null);
      alert('补全失败: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] pointer-events-auto">
      <Card className="w-full max-w-6xl h-[80vh] bg-white/95 backdrop-blur-sm border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <File className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sky-900">{t('vtuber.model.manager')}</CardTitle>
                <p className="text-sm text-sky-600">{t('vtuber.model.title')}</p>
                {backfillStatus && (
                  <p className="text-xs text-amber-600 mt-1 truncate max-w-md" title={backfillStatus}>{backfillStatus}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                disabled={backfilling}
                onClick={handleBackfillThumbnails}
              >
                {backfilling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                补全缺失缩略图
              </Button>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('vtuber.model.upload')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-sky-200">
                  <DialogHeader>
                    <DialogTitle className="text-sky-900">{t('vtuber.model.uploadVRM')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="model-file" className="text-sky-700">{t('vtuber.model.selectVRMFile')}</Label>
                      <Input
                        id="model-file"
                        type="file"
                        accept=".vrm"
                        multiple
                        onChange={handleFileChange}
                        className="border-sky-200 focus:border-sky-500"
                      />
                    </div>
                    
                    {uploadFiles.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-sky-700 font-medium">
                          已选择 {uploadFiles.length} 个文件：
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {uploadFiles.map((file, index) => (
                            <div key={index} className="p-2 bg-sky-50 border border-sky-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-sky-600" />
                                <span className="text-sm text-sky-700">{file.name}</span>
                                <span className="text-xs text-sky-500">
                                  ({s3Uploader.formatFileSize(file.size)})
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                          <span className="text-sm text-sky-700">
                            {t('vtuber.model.uploading')} {uploadProgress.toFixed(1)}%
                            {uploadFiles.length > 1 && (
                              <span className="ml-2 text-xs">
                                ({currentUploadIndex + 1}/{uploadFiles.length})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-sky-100 rounded-full h-2">
                          <div 
                            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        {uploadResults.length > 0 && (
                          <div className="text-xs text-sky-600">
                            已完成: {uploadResults.length}/{uploadFiles.length}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadDialogOpen(false);
                          setUploadFiles([]);
                          setUploadFile(null);
                        }}
                        className="border-sky-200 text-sky-700 hover:bg-sky-50"
                      >
                        {t('app.cancel')}
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={uploadFiles.length === 0 || uploading}
                        className="bg-sky-500 hover:bg-sky-600 text-white"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('vtuber.model.uploading')}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadFiles.length > 1 ? `上传 ${uploadFiles.length} 个文件` : t('vtuber.model.upload')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 h-full flex flex-col">
          {/* 搜索和过滤 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                <Input
                  placeholder={t('vtuber.model.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-sky-200 focus:border-sky-500"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-sky-200 focus:border-sky-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? t('vtuber.model.allCategories') : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 模型列表 */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                <div className="text-sky-600 text-center">
                  <div>{t('vtuber.model.loading')}</div>
                  <div className="text-xs text-sky-400 mt-1">
                    从云端获取资源信息
                  </div>
                </div>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sky-500 text-center">
                  <div>{t('vtuber.model.noModels')}</div>
                  {searchTerm && (
                    <div className="text-sm text-sky-400 mt-1">
                      搜索: &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                  <Card
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className="cursor-pointer hover:border-sky-300 hover:shadow-lg transition-all border-sky-100 bg-white"
                  >
                    <CardContent className="p-4">
                      {/* 缩略图：优先客户端生成的，再 thumbnail，再 /api/vrm-thumbnail；失败则尝试客户端生成证件照 */}
                      <div className="aspect-square bg-sky-50 rounded-lg mb-3 flex items-center justify-center border border-sky-100 overflow-hidden">
                        {(clientThumbnails[model.id] || model.thumbnail || model.url?.startsWith('http')) ? (
                          <>
                            <img
                              src={
                                clientThumbnails[model.id] ||
                                model.thumbnail ||
                                `/api/vrm-thumbnail?url=${encodeURIComponent(model.url)}`
                              }
                              alt={model.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={async (e) => {
                                const el = e.currentTarget;
                                if (clientThumbnails[model.id]) return;
                                if (!model.url?.toLowerCase().endsWith('.vrm')) {
                                  el.style.display = 'none';
                                  (el.nextElementSibling as HTMLElement)!.style.display = 'flex';
                                  return;
                                }
                                try {
                                  const res = await fetch(model.url);
                                  if (!res.ok) throw new Error('fetch failed');
                                  const blob = await res.blob();
                                  const file = new File([blob], (model.name || 'model') + '.vrm', { type: 'model/vrm' });
                                  const result = await generateVrmThumbnailBlob(file);
                                  if (result?.blob) {
                                    const url = URL.createObjectURL(result.blob);
                                    setClientThumbnails((prev) => ({ ...prev, [model.id]: url }));
                                    return;
                                  }
                                } catch (_) {}
                                el.style.display = 'none';
                                (el.nextElementSibling as HTMLElement)!.style.display = 'flex';
                              }}
                            />
                            <div className="text-sky-400 text-4xl hidden">🎭</div>
                          </>
                        ) : (
                          <div className="text-sky-400 text-4xl">🎭</div>
                        )}
                      </div>

                      {/* 模型信息 */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-sky-900 truncate">
                          {model.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-sky-600">
                          <span className="capitalize">{model.category}</span>
                          {model.url.startsWith('http') && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>{t('vtuber.model.cloud')}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 文件信息 */}
                        {model.size && (
                          <div className="text-xs text-sky-500">
                            {s3Uploader.formatFileSize(model.size)}
                            {model.type && ` • ${model.type.split('/').pop()?.toUpperCase()}`}
                          </div>
                        )}
                        
                        {/* 标签 */}
                        {model.tags && model.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {model.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-sky-100 text-sky-700 border-sky-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {model.tags.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-sky-100 text-sky-700 border-sky-200"
                              >
                                +{model.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="mt-6 pt-4 border-t border-sky-200">
            <div className="text-sm text-sky-600">
              共 {filteredModels.length} 个模型
              {searchTerm && ` (搜索: &quot;${searchTerm}&quot;)`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
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
  Play, 
  Plus, 
  File, 
  Globe,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Music,
  Trash2,
  User
} from 'lucide-react';
import { useAnimationLibrary } from '@/hooks/use-animation-library';
import { Animation } from '@/types';
import { useI18n } from '@/hooks/use-i18n';
import { useTracking } from '@/hooks/use-tracking';
import { s3Uploader } from '@/lib/s3-uploader';
import { animationStorage } from '@/lib/animation-storage';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';

interface AnimationLibraryProps {
  onClose: () => void;
  onSelect: (animation: Animation) => void;
}

export const AnimationLibrary: React.FC<AnimationLibraryProps> = ({ onClose, onSelect }) => {
  const { t } = useI18n();
  const { trackFeatureUsed, trackError } = useTracking();
  const { 
    animations, 
    loading, 
    error, 
    getSelectedAnimation, 
    selectAnimation,
    addUserAnimation,
    removeUserAnimation,
    getUserAnimationStats
  } = useAnimationLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [allAnimations, setAllAnimations] = useState<Animation[]>([]);
  const [isLoadingS3, setIsLoadingS3] = useState(false);

  const selectedAnimation = getSelectedAnimation();

  // 加载动画：优先用 Loading 阶段预拉的 S3 缓存，再刷新
  useEffect(() => {
    const merge = (local: Animation[], s3: Animation[]) => {
      const all = [...local];
      const ids = new Set(local.map(a => a.id));
      s3.forEach(a => { if (!ids.has(a.id)) { ids.add(a.id); all.push(a); } });
      return all;
    };

    const loadAnimations = async () => {
      const localAnimations = animations || [];
      const store = useS3ResourcesStore.getState();
      if (store.animationsLoaded && store.s3Animations.length >= 0) {
        setAllAnimations(merge(localAnimations, store.s3Animations));
      }
      setIsLoadingS3(true);
      try {
        await store.loadAnimations();
        const s3Animations = useS3ResourcesStore.getState().s3Animations;
        setAllAnimations(merge(localAnimations, s3Animations));
        trackFeatureUsed('animations_loaded', 'animation_management');
      } catch (error) {
        console.error('Failed to load animations:', error);
        trackError('animation_load_error', error.toString(), 'animation_library');
      } finally {
        setIsLoadingS3(false);
      }
    };

    loadAnimations();
  }, [animations, trackFeatureUsed, trackError]);

  // 过滤动画 - 添加安全检查
  const filteredAnimations = allAnimations.filter((animation: any) => {
    const matchesSearch = animation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animation.description && animation.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || animation.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 获取所有分类 - 添加安全检查
  const categories = ['all', ...new Set(allAnimations.map((animation: any) => animation.category))];

  // 处理动画选择
  const handleAnimationSelect = (animation: Animation) => {
    trackFeatureUsed('animation_selected', 'animation_management');
    onSelect(animation);
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
        const validationErrors = s3Uploader.validateFile(file);
        if (validationErrors.length > 0) {
          errors.push(`${file.name}: ${validationErrors.join(', ')}`);
        } else {
          validFiles.push(file);
        }
      });
      
      // 显示错误信息
      if (errors.length > 0) {
        trackError('file_validation_error', errors.join(', '), 'animation_library');
        alert(`以下文件验证失败：\n${errors.join('\n')}`);
      }
      
      // 设置有效文件
      if (validFiles.length > 0) {
        setUploadFiles(validFiles);
        setUploadFile(validFiles[0]); // 保持兼容性
        trackFeatureUsed('animation_files_selected', 'animation_upload', validFiles.length);
      }
    }
  };

  // 处理动画上传
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
    setUploadResults([]);

    try {
      trackFeatureUsed('animation_upload_started', 'animation_upload', uploadFiles.length);
      const uploadedAnimations: Animation[] = [];
      
      // 逐个上传文件
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setCurrentUploadIndex(i);
        
        console.log(`开始上传动画 ${i + 1}/${uploadFiles.length}:`, file.name);
        
        // 使用S3上传器上传文件
        const uploadResult = await s3Uploader.uploadFile(file, (progress) => {
          // 计算总体进度
          const totalProgress = ((i + progress / 100) / uploadFiles.length) * 100;
          setUploadProgress(totalProgress);
          console.log(`上传进度 ${i + 1}/${uploadFiles.length}:`, progress);
        });

        console.log(`上传完成 ${i + 1}/${uploadFiles.length}:`, uploadResult);
        
        // 创建新的动画对象
        const newAnimation: Animation = {
          id: `user-${Date.now()}-${i}-${file.name}`,
          name: file.name.replace('.fbx', ''),
          url: uploadResult.url,
          type: 'custom',
          thumbnail: null,
          tags: ['uploaded', 'FBX', 'user'],
          description: `用户上传的动画文件`,
          duration: 0, // 可以后续添加动画时长检测
          size: uploadResult.size,
          mimeType: uploadResult.type,
          category: 'user-uploaded',
          createdAt: new Date().toISOString()
        };

        uploadedAnimations.push(newAnimation);
        setUploadResults(prev => [...prev, { file: file.name, success: true }]);
        
        // 保存到本地存储
        addUserAnimation(newAnimation);
      }

      // 立即添加到当前显示的动画列表中
      setAllAnimations(prevAnimations => [...uploadedAnimations, ...prevAnimations]);
      trackFeatureUsed('animation_upload_completed', 'animation_upload', uploadedAnimations.length);
      
      // 刷新 S3 缓存并更新列表
      const store = useS3ResourcesStore.getState();
      await store.loadAnimations();
      const s3Animations = useS3ResourcesStore.getState().s3Animations;
      const localAnimations = animations || [];
      const all = [...localAnimations];
      const ids = new Set(localAnimations.map((a: Animation) => a.id));
      s3Animations.forEach((a: Animation) => { if (!ids.has(a.id)) { ids.add(a.id); all.push(a); } });
      setAllAnimations(all);
      
      // 上传成功后关闭对话框并重置状态
      setUploading(false);
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadFile(null);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
      setUploadResults([]);
      
      // 显示成功消息
      alert(`成功上传 ${uploadedAnimations.length} 个动画！已添加到动画列表。`);

    } catch (error) {
      console.error('上传失败:', error);
      alert(`上传失败: ${error instanceof Error ? error.message : String(error)}`);
      setUploading(false);
      setCurrentUploadIndex(0);
    }
  };

  // 处理删除用户动画
  const handleDeleteAnimation = (animation: Animation) => {
    if (animationStorage.isUserAnimation(animation.id)) {
      if (confirm(`确定要删除动画 "${animation.name}" 吗？`)) {
        removeUserAnimation(animation.id);
        trackFeatureUsed('animation_deleted', 'animation_management');
        alert('动画已从本地库中删除');
      }
    } else {
      alert('只能删除用户上传的动画');
    }
  };

  // 获取用户动画统计
  const userStats = getUserAnimationStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
      <Card className="w-full max-w-6xl h-[80vh] bg-white/95 backdrop-blur-sm border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Music className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sky-900">{t('vtuber.animation.library')}</CardTitle>
                <p className="text-sm text-sky-600">
                  {t('vtuber.animation.title')} 
                  {userStats.totalUserAnimations > 0 && (
                    <span className="ml-2 text-xs bg-sky-200 px-2 py-1 rounded">
                      本地: {userStats.totalUserAnimations} 个
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('vtuber.animation.upload')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-sky-200">
                  <DialogHeader>
                    <DialogTitle className="text-sky-900">{t('vtuber.animation.uploadFBX')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="animation-file" className="text-sky-700">{t('vtuber.animation.selectFBXFile')}</Label>
                      <Input
                        id="animation-file"
                        type="file"
                        accept=".fbx"
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
                            {t('vtuber.animation.uploading')} {uploadProgress.toFixed(1)}%
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
                            {t('vtuber.animation.uploading')}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadFiles.length > 1 ? `上传 ${uploadFiles.length} 个文件` : t('vtuber.animation.upload')}
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
          {/* 搜索和筛选 */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sky-400" />
                <Input
                  placeholder={t('vtuber.animation.search')}
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
                      {category === 'all' ? t('vtuber.animation.allCategories') : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between text-sm text-sky-600">
              <span>找到 {filteredAnimations.length} 个动画</span>
              {selectedAnimation && (
                <span className="text-sky-700 font-medium">
                  {t('vtuber.animation.current')}: {(selectedAnimation as any).name}
                </span>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 text-sm">
                <div className="font-medium">{t('app.error')}</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {/* 动画列表 */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingS3 ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                <div className="text-sky-600 text-center">
                  <div>{t('vtuber.animation.loading')}</div>
                  <div className="text-xs text-sky-400 mt-1">
                    从云端获取资源信息
                  </div>
                </div>
              </div>
            ) : filteredAnimations.length === 0 ? (
              <div className="text-center py-8 text-sky-500">
                <div className="w-12 h-12 mx-auto mb-4 text-sky-300">
                  <Music className="w-full h-full" />
                </div>
                <p>{t('vtuber.animation.noAnimations')}</p>
                <p className="text-sm text-sky-400">尝试调整搜索条件</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAnimations.map((animation: any) => (
                  <Card
                    key={animation.id}
                    className={`cursor-pointer hover:border-sky-300 transition-all border-sky-100 bg-white relative ${
                      (selectedAnimation as any)?.id === animation.id ? 'ring-2 ring-sky-500' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* 用户动画标识 */}
                      {animationStorage.isUserAnimation(animation.id) && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            <User className="h-3 w-3 mr-1" />
                            本地
                          </Badge>
                        </div>
                      )}

                      {/* 删除按钮（仅用户动画） */}
                      {animationStorage.isUserAnimation(animation.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnimation(animation);
                          }}
                          className="absolute top-2 left-2 h-6 w-6 p-0 bg-red-50 hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}

                      {/* 缩略图 */}
                      <div 
                        className="aspect-square bg-sky-50 rounded-lg mb-3 flex items-center justify-center border border-sky-100 cursor-pointer"
                        onClick={() => handleAnimationSelect(animation)}
                      >
                        {animation.thumbnail ? (
                          <img
                            src={animation.thumbnail}
                            alt={animation.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-sky-400 text-4xl">🎬</div>
                        )}
                      </div>

                      {/* 动画信息 */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-sky-900 truncate">
                          {animation.name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-sky-600">
                          <span className="capitalize">{animation.type}</span>
                          {animation.duration && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{animation.duration}s</span>
                            </div>
                          )}
                        </div>
                        
                        {/* 文件信息 */}
                        {animation.size && (
                          <div className="text-xs text-sky-500">
                            {s3Uploader.formatFileSize(animation.size)}
                            {animation.mimeType && ` • ${animation.mimeType.split('/').pop()?.toUpperCase()}`}
                          </div>
                        )}
                        
                        {animation.url.startsWith('http') && (
                          <div className="flex items-center space-x-1 text-xs text-sky-500">
                            <Globe className="h-3 w-3" />
                            <span>{t('vtuber.model.cloud')}</span>
                          </div>
                        )}
                        
                        {/* 标签 */}
                        {animation.tags && animation.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {animation.tags.slice(0, 3).map((tag: any, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-sky-100 text-sky-700 border-sky-200"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {animation.tags.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-sky-100 text-sky-700 border-sky-200"
                              >
                                +{animation.tags.length - 3}
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
              共 {filteredAnimations.length} 个动画
              {searchTerm && ` (搜索: "${searchTerm}")`}
              {userStats.totalUserAnimations > 0 && (
                <span className="ml-2 text-green-600">
                  • 本地保存: {userStats.totalUserAnimations} 个
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
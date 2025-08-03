import React, { useState } from 'react';
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
  Music
} from 'lucide-react';
import { useAnimationLibrary } from '@/hooks/use-animation-library';
import { Animation } from '@/types';
import { useI18n } from '@/hooks/use-i18n';

interface AnimationLibraryProps {
  onClose: () => void;
  onSelect: (animation: Animation) => void;
}

export const AnimationLibrary: React.FC<AnimationLibraryProps> = ({ onClose, onSelect }) => {
  const { t } = useI18n();
  const { animations, loading, error, getSelectedAnimation, selectAnimation } = useAnimationLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectedAnimation = getSelectedAnimation();

  // 过滤动画 - 添加安全检查
  const filteredAnimations = (animations || []).filter((animation: any) => {
    const matchesSearch = animation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animation.description && animation.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || animation.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 获取所有分类 - 添加安全检查
  const categories = ['all', ...new Set((animations || []).map((animation: any) => animation.category))];

  // 处理动画选择
  const handleAnimationSelect = (animation: Animation) => {
    onSelect(animation);
    onClose();
  };

  // 处理文件上传
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'application/octet-stream' || file.name.endsWith('.fbx'))) {
      setUploadFile(file);
    } else {
      alert(t('vtuber.animation.uploadError'));
    }
  };

  // 处理动画上传
  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', 'animation');
      formData.append('category', 'custom');

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // 这里应该调用实际的上传API
      // await uploadAnimation(formData);
      
      // 模拟上传完成
      setTimeout(() => {
        setUploadProgress(100);
        setUploading(false);
        setUploadDialogOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl h-[80vh] bg-white/95 backdrop-blur-sm border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Music className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sky-900">{t('vtuber.animation.library')}</CardTitle>
                <p className="text-sm text-sky-600">{t('vtuber.animation.title')}</p>
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
                        onChange={handleFileChange}
                        className="border-sky-200 focus:border-sky-500"
                      />
                    </div>
                    
                    {uploadFile && (
                      <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <File className="h-4 w-4 text-sky-600" />
                          <span className="text-sm text-sky-700">{uploadFile.name}</span>
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                          <span className="text-sm text-sky-700">{t('vtuber.animation.uploading')} {uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-sky-100 rounded-full h-2">
                          <div 
                            className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setUploadDialogOpen(false)}
                        className="border-sky-200 text-sky-700 hover:bg-sky-50"
                      >
                        {t('app.cancel')}
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={!uploadFile || uploading}
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
                            {t('vtuber.animation.upload')}
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
            {loading ? (
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
                    onClick={() => handleAnimationSelect(animation)}
                    className={`cursor-pointer hover:border-sky-300 hover:shadow-lg transition-all border-sky-100 bg-white ${
                      (selectedAnimation as any)?.id === animation.id ? 'ring-2 ring-sky-500' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* 缩略图 */}
                      <div className="aspect-square bg-sky-50 rounded-lg mb-3 flex items-center justify-center border border-sky-100">
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
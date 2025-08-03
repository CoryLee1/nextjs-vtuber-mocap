import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Performance, 
  Globe, 
  Palette, 
  Keyboard,
  Monitor,
  HardDrive,
  Cpu,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { usePerformance } from '@/hooks/use-performance';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t, getCurrentLocale, getAvailableLocales, changeLocale } = useI18n();
  const { settings, fps, memoryUsage, updateSettings } = usePerformance();
  const { shortcuts, getShortcutDescription, checkConflicts } = useShortcuts();

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const currentLocale = getCurrentLocale();
  const availableLocales = getAvailableLocales();

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setHasChanges(true);
  };

  const handleSave = () => {
    // 保存设置到本地存储
    localStorage.setItem('vtuber-settings', JSON.stringify(settings));
    setHasChanges(false);
  };

  const handleReset = () => {
    // 重置设置
    updateSettings({
      quality: 'medium',
      fps: 60,
      resolution: 1,
      antialiasing: true,
      shadows: true,
      bloom: true,
      optimization: 'auto',
    });
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] bg-white/95 backdrop-blur-sm border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Settings className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sky-900">{t('settings.title')}</CardTitle>
                <p className="text-sm text-sky-600">配置应用设置和偏好</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 快速语言切换 */}
              <LanguageSwitcher />
              
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  未保存
                </Badge>
              )}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-5 bg-sky-50">
              <TabsTrigger value="general" className="text-sky-700">常规</TabsTrigger>
              <TabsTrigger value="performance" className="text-sky-700">性能</TabsTrigger>
              <TabsTrigger value="language" className="text-sky-700">语言</TabsTrigger>
              <TabsTrigger value="theme" className="text-sky-700">主题</TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-sky-700">快捷键</TabsTrigger>
            </TabsList>

            {/* 常规设置 */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">基本设置</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">应用名称</Label>
                    <Input 
                      value={t('app.title')} 
                      disabled 
                      className="border-sky-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">版本</Label>
                    <Input 
                      value="1.0.0" 
                      disabled 
                      className="border-sky-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">系统信息</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">当前 FPS</Label>
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-sky-600" />
                      <span className="text-sky-900 font-medium">{fps}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">内存使用</Label>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-sky-600" />
                      <span className="text-sky-900 font-medium">{memoryUsage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 性能设置 */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">渲染质量</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">质量等级</Label>
                    <Select 
                      value={settings.quality} 
                      onValueChange={(value) => handleSettingChange('quality', value)}
                    >
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">低</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="high">高</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">目标 FPS</Label>
                    <Input 
                      type="number"
                      value={settings.fps}
                      onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
                      className="border-sky-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">分辨率缩放</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="2"
                      value={settings.resolution}
                      onChange={(e) => handleSettingChange('resolution', parseFloat(e.target.value))}
                      className="border-sky-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">渲染选项</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">抗锯齿</Label>
                    <Switch 
                      checked={settings.antialiasing}
                      onCheckedChange={(checked) => handleSettingChange('antialiasing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">阴影</Label>
                    <Switch 
                      checked={settings.shadows}
                      onCheckedChange={(checked) => handleSettingChange('shadows', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">泛光效果</Label>
                    <Switch 
                      checked={settings.bloom}
                      onCheckedChange={(checked) => handleSettingChange('bloom', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">优化模式</Label>
                    <Select 
                      value={settings.optimization} 
                      onValueChange={(value) => handleSettingChange('optimization', value)}
                    >
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">自动</SelectItem>
                        <SelectItem value="manual">手动</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 语言设置 */}
            <TabsContent value="language" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-sky-900">语言选择</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availableLocales.map((locale) => (
                    <Card
                      key={locale.code}
                      className={`cursor-pointer transition-all ${
                        locale.isCurrent 
                          ? 'border-sky-500 bg-sky-50' 
                          : 'border-sky-200 hover:border-sky-300'
                      }`}
                      onClick={() => changeLocale(locale.code)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{locale.flag}</span>
                          <div>
                            <div className="font-medium text-sky-900">{locale.name}</div>
                            {locale.isCurrent && (
                              <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700">
                                当前
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* 主题设置 */}
            <TabsContent value="theme" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">主题选择</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">主题模式</Label>
                    <Select defaultValue="light">
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">浅色</SelectItem>
                        <SelectItem value="dark">深色</SelectItem>
                        <SelectItem value="auto">自动</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">主色调</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {['#0ea5e9', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((color) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded-full cursor-pointer border-2 border-sky-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">预览</h3>
                  
                  <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                    <div className="text-sm text-sky-700">
                      主题预览区域
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 快捷键设置 */}
            <TabsContent value="shortcuts" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-sky-900">快捷键配置</h3>
                
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-sky-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Keyboard className="h-4 w-4 text-sky-600" />
                        <span className="text-sky-900">{shortcut.description}</span>
                      </div>
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-sky-200">
                        {getShortcutDescription(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 底部操作按钮 */}
          <div className="flex items-center justify-between pt-6 border-t border-sky-200">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
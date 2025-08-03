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
                <p className="text-sm text-sky-600">{t('settings.description')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* 快速语言切换 */}
              <LanguageSwitcher />
              
              {hasChanges && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  {t('settings.unsaved')}
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
              <TabsTrigger value="general" className="text-sky-700">{t('settings.general')}</TabsTrigger>
              <TabsTrigger value="performance" className="text-sky-700">{t('settings.performance')}</TabsTrigger>
              <TabsTrigger value="language" className="text-sky-700">{t('settings.language')}</TabsTrigger>
              <TabsTrigger value="theme" className="text-sky-700">{t('settings.theme')}</TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-sky-700">{t('settings.shortcuts')}</TabsTrigger>
            </TabsList>

            {/* 常规设置 */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">{t('settings.basicSettings')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('settings.appName')}</Label>
                    <Input 
                      value={t('app.title')} 
                      disabled 
                      className="border-sky-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('settings.version')}</Label>
                    <Input 
                      value="1.0.0" 
                      disabled 
                      className="border-sky-200"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-sky-900">{t('settings.systemInfo')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.currentFps')}</Label>
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-sky-600" />
                      <span className="text-sky-900 font-medium">{fps}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.memoryUsage')}</Label>
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
                  <h3 className="text-lg font-medium text-sky-900">{t('performance.renderQuality')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.quality')}</Label>
                    <Select 
                      value={settings.quality} 
                      onValueChange={(value) => handleSettingChange('quality', value)}
                    >
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('performance.low')}</SelectItem>
                        <SelectItem value="medium">{t('performance.medium')}</SelectItem>
                        <SelectItem value="high">{t('performance.high')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.targetFps')}</Label>
                    <Input 
                      type="number"
                      value={settings.fps}
                      onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
                      className="border-sky-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.resolutionScale')}</Label>
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
                  <h3 className="text-lg font-medium text-sky-900">{t('performance.renderOptions')}</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">{t('performance.antialiasing')}</Label>
                    <Switch 
                      checked={settings.antialiasing}
                      onCheckedChange={(checked) => handleSettingChange('antialiasing', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">{t('performance.shadows')}</Label>
                    <Switch 
                      checked={settings.shadows}
                      onCheckedChange={(checked) => handleSettingChange('shadows', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sky-700">{t('performance.bloom')}</Label>
                    <Switch 
                      checked={settings.bloom}
                      onCheckedChange={(checked) => handleSettingChange('bloom', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('performance.optimization')}</Label>
                    <Select 
                      value={settings.optimization} 
                      onValueChange={(value) => handleSettingChange('optimization', value)}
                    >
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">{t('performance.auto')}</SelectItem>
                        <SelectItem value="manual">{t('performance.manual')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 语言设置 */}
            <TabsContent value="language" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-sky-900">{t('languages.select')}</h3>
                
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
                                {t('languages.current')}
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
                  <h3 className="text-lg font-medium text-sky-900">{t('theme.title')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('theme.mode')}</Label>
                    <Select defaultValue="light">
                      <SelectTrigger className="border-sky-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t('theme.light')}</SelectItem>
                        <SelectItem value="dark">{t('theme.dark')}</SelectItem>
                        <SelectItem value="auto">{t('theme.auto')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sky-700">{t('theme.primaryColor')}</Label>
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
                  <h3 className="text-lg font-medium text-sky-900">{t('theme.preview')}</h3>
                  
                  <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                    <div className="text-sm text-sky-700">
                      {t('theme.previewArea')}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 快捷键设置 */}
            <TabsContent value="shortcuts" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-sky-900">{t('shortcuts.title')}</h3>
                
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
              {t('settings.reset')}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                {t('app.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {t('app.save')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
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
import { useThemeContext } from '@/providers/ThemeProvider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { t, getCurrentLocale, getAvailableLocales, changeLocale } = useI18n();
  const { settings, fps, memoryUsage, updateSettings } = usePerformance();
  const { shortcuts, getShortcutDescription, checkConflicts } = useShortcuts();
  const { 
    themeMode, 
    primaryColor, 
    updateThemeMode, 
    updatePrimaryColor, 
    resetTheme 
  } = useThemeContext();

  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);

  if (!isOpen) return null;

  const currentLocale = getCurrentLocale();
  const availableLocales = getAvailableLocales();

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    setHasChanges(true);
  };

  const handleThemeModeChange = (value: string) => {
    updateThemeMode(value as 'light' | 'dark' | 'auto');
    setHasChanges(true);
  };

  const handlePrimaryColorChange = (color: string) => {
    updatePrimaryColor(color);
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
    
    // 重置主题设置
    resetTheme();
    
    setHasChanges(false);
  };

  // 主题颜色选项
  const themeColors = [
    { color: '#0ea5e9', name: 'Sky Blue' },
    { color: '#3b82f6', name: 'Blue' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#ef4444', name: 'Red' },
    { color: '#10b981', name: 'Green' },
    { color: '#f97316', name: 'Orange' },
    { color: '#ec4899', name: 'Pink' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] bg-card/95 backdrop-blur-sm border-border">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">{t('settings.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
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
                className="border-border text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              <TabsTrigger value="general" className="text-foreground">{t('settings.general')}</TabsTrigger>
              <TabsTrigger value="performance" className="text-foreground">{t('settings.performance')}</TabsTrigger>
              <TabsTrigger value="language" className="text-foreground">{t('settings.language')}</TabsTrigger>
              <TabsTrigger value="theme" className="text-foreground">{t('settings.theme')}</TabsTrigger>
              <TabsTrigger value="shortcuts" className="text-foreground">{t('settings.shortcuts')}</TabsTrigger>
            </TabsList>

            {/* 常规设置 */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card-foreground">{t('settings.basicSettings')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t('settings.appName')}</Label>
                    <Input 
                      value={t('app.title')} 
                      disabled 
                      className="border-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t('settings.version')}</Label>
                    <Input 
                      value="1.0.0" 
                      disabled 
                      className="border-border"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card-foreground">{t('settings.systemInfo')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t('performance.currentFps')}</Label>
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-primary" />
                      <span className="text-card-foreground font-medium">{fps}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t('performance.memoryUsage')}</Label>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="h-4 w-4 text-primary" />
                      <span className="text-card-foreground font-medium">{memoryUsage}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 性能设置 */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card-foreground">{t('performance.renderQuality')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t('performance.quality')}</Label>
                    <Select 
                      value={settings.quality} 
                      onValueChange={(value) => handleSettingChange('quality', value)}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{t('performance.qualityLow')}</SelectItem>
                        <SelectItem value="medium">{t('performance.qualityMedium')}</SelectItem>
                        <SelectItem value="high">{t('performance.qualityHigh')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t('performance.fps')}</Label>
                    <Select 
                      value={settings.fps.toString()} 
                      onValueChange={(value) => handleSettingChange('fps', parseInt(value))}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="120">120 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">{t('performance.resolution')}</Label>
                    <Select 
                      value={settings.resolution.toString()} 
                      onValueChange={(value) => handleSettingChange('resolution', parseFloat(value))}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5x</SelectItem>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="1.5">1.5x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card-foreground">{t('performance.advanced')}</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-foreground">{t('performance.antialiasing')}</Label>
                        <p className="text-sm text-muted-foreground">{t('performance.antialiasingDesc')}</p>
                      </div>
                      <Switch
                        checked={settings.antialiasing}
                        onCheckedChange={(checked) => handleSettingChange('antialiasing', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-foreground">{t('performance.shadows')}</Label>
                        <p className="text-sm text-muted-foreground">{t('performance.shadowsDesc')}</p>
                      </div>
                      <Switch
                        checked={settings.shadows}
                        onCheckedChange={(checked) => handleSettingChange('shadows', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-foreground">{t('performance.bloom')}</Label>
                        <p className="text-sm text-muted-foreground">{t('performance.bloomDesc')}</p>
                      </div>
                      <Switch
                        checked={settings.bloom}
                        onCheckedChange={(checked) => handleSettingChange('bloom', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 语言设置 */}
            <TabsContent value="language" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">{t('languages.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('languages.description')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableLocales.map((locale) => (
                    <Card
                      key={locale.code}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        locale.isCurrent 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => changeLocale(locale.code)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{locale.flag}</span>
                          <div>
                            <div className="font-medium text-card-foreground">{locale.name}</div>
                            {locale.isCurrent && (
                              <Badge variant="secondary" className="text-xs">
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
                  <h3 className="text-lg font-medium text-card-foreground">{t('theme.title')}</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-foreground">{t('theme.mode')}</Label>
                    <Select value={themeMode} onValueChange={handleThemeModeChange}>
                      <SelectTrigger className="border-border">
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
                    <Label className="text-foreground">{t('theme.primaryColor')}</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {themeColors.map((themeColor) => (
                        <div
                          key={themeColor.color}
                          className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all hover:scale-110 ${
                            primaryColor === themeColor.color 
                              ? 'border-primary ring-2 ring-primary/20' 
                              : 'border-border'
                          }`}
                          style={{ backgroundColor: themeColor.color }}
                          onClick={() => handlePrimaryColorChange(themeColor.color)}
                          title={themeColor.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">自定义颜色</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                        className="w-16 h-10 p-1 border-border"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => handlePrimaryColorChange(e.target.value)}
                        className="flex-1 border-border"
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-card-foreground">{t('theme.preview')}</h3>
                  
                  <div className="p-6 bg-card rounded-lg border border-border shadow-sm">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {t('theme.previewArea')}
                      </div>
                      
                      {/* 主题预览 */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: primaryColor }}
                          />
                          <span className="text-sm font-medium text-card-foreground">主色调</span>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            size="sm"
                            style={{ backgroundColor: primaryColor }}
                            className="text-white hover:opacity-90"
                          >
                            主要按钮
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          >
                            次要按钮
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          当前主题模式: {themeMode === 'auto' ? '自动' : themeMode === 'dark' ? '深色' : '浅色'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 快捷键设置 */}
            <TabsContent value="shortcuts" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">{t('shortcuts.title')}</h3>
                
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Keyboard className="h-4 w-4 text-primary" />
                        <span className="text-card-foreground">{shortcut.description}</span>
                      </div>
                      <Badge variant="secondary">
                        {getShortcutDescription(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* 底部操作按钮 */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-border text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.reset')}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-border text-foreground hover:bg-muted"
              >
                {t('app.cancel')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
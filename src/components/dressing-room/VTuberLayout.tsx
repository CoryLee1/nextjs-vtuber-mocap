import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Settings, 
  Users, 
  Play, 
  Square, 
  Eye, 
  EyeOff,
  Bug,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// 状态指示器组件
interface StatusIndicatorProps {
  isActive: boolean;
  isProcessing: boolean;
  error: string | null;
  onClearError: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isActive,
  isProcessing,
  error,
  onClearError
}) => {
  const { t } = useI18n();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-auto">
      {/* 语言切换器和主题切换器 */}
      <div className="flex justify-end space-x-2">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      {/* 处理状态 */}
      {isProcessing && (
        <Card className="bg-muted/50 backdrop-blur-sm border-border shadow-lg">
          <CardContent className="p-3 flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-foreground">{t('vtuber.status.processing')}</span>
          </CardContent>
        </Card>
      )}

      {/* 错误状态 */}
      {error && (
        <Card className="bg-destructive/10 backdrop-blur-sm border-destructive/20 shadow-lg">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive-foreground">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 摄像头状态 */}
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-lg">
        <CardContent className="p-3 flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-card-foreground">
            {isActive ? t('vtuber.camera.connected') : t('vtuber.camera.disconnected')}
          </span>
        </CardContent>
      </Card>
    </div>
  );
};

// 控制面板组件
interface ControlPanelProps {
  isCameraActive: boolean;
  showBones: boolean;
  showDebug: boolean;
  onCameraToggle: () => void;
  onToggleBones: () => void;
  onToggleDebug: () => void;
  onOpenModelManager: () => void;
  onOpenAnimationLibrary: () => void;
  onOpenConfigManager: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isCameraActive,
  showBones,
  showDebug,
  onCameraToggle,
  onToggleBones,
  onToggleDebug,
  onOpenModelManager,
  onOpenAnimationLibrary,
  onOpenConfigManager
}) => {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-auto">
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-xl pointer-events-auto">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-sm font-medium text-card-foreground">{t('vtuber.controls.title')}</h3>
            <Badge variant="secondary" className="text-xs">
              VTuber
            </Badge>
          </div>
          
          <div className="space-y-3">
            {/* 摄像头控制 */}
            <Button
              variant={isCameraActive ? "default" : "outline"}
              size="sm"
              onClick={onCameraToggle}
              className="w-full justify-start"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isCameraActive ? t('vtuber.camera.stop') : t('vtuber.camera.start')}
            </Button>

            {/* 功能按钮组 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={showBones ? "default" : "outline"}
                size="sm"
                onClick={onToggleBones}
                className="justify-start"
              >
                {showBones ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {t('vtuber.controls.bones')}
              </Button>

              <Button
                variant={showDebug ? "default" : "outline"}
                size="sm"
                onClick={onToggleDebug}
                className="justify-start"
              >
                <Bug className="h-4 w-4 mr-2" />
                {t('vtuber.controls.debug')}
              </Button>
            </div>

            {/* 管理按钮组 */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenModelManager}
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                {t('vtuber.model.manager')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAnimationLibrary}
                className="w-full justify-start"
              >
                <Play className="h-4 w-4 mr-2" />
                {t('vtuber.animation.library')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenConfigManager}
                className="w-full justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('settings.title')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 主布局组件
interface VTuberLayoutProps {
  children: ReactNode;
  statusProps: StatusIndicatorProps;
  controlProps: ControlPanelProps;
}

export const VTuberLayout: React.FC<VTuberLayoutProps> = ({
  children,
  statusProps,
  controlProps
}) => {
  return (
    <div className="relative w-full h-screen overflow-hidden theme-transition pointer-events-none">
      {/* 子组件容器 - 让没有内容的地方事件穿透到 Canvas */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* 子组件自己设置 pointer-events-auto */}
        {children}
      </div>

      {/* UI覆盖层 - 状态指示器 */}
      <StatusIndicator {...statusProps} />

      {/* UI覆盖层 - 控制面板 */}
      <ControlPanel {...controlProps} />
    </div>
  );
}; 
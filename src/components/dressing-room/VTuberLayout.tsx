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
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* 语言切换器 */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* 处理状态 */}
      {isProcessing && (
        <Card className="bg-sky-50 border-sky-200 shadow-lg">
          <CardContent className="p-3 flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
            <span className="text-sm text-sky-700">{t('vtuber.status.processing')}</span>
          </CardContent>
        </Card>
      )}

      {/* 错误状态 */}
      {error && (
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearError}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 摄像头状态 */}
      <Card className="bg-white/95 backdrop-blur-sm border-sky-200 shadow-lg">
        <CardContent className="p-3 flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-sky-500' : 'bg-sky-300'}`} />
          <span className="text-sm text-sky-700">
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
    <div className="fixed bottom-4 left-4 z-50">
      <Card className="bg-white/95 backdrop-blur-sm border-sky-200 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-sm font-medium text-sky-900">{t('vtuber.controls.title')}</h3>
            <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 border-sky-200">
              VTuber
            </Badge>
          </div>
          
          <div className="space-y-3">
            {/* 摄像头控制 */}
            <Button
              variant={isCameraActive ? "default" : "outline"}
              size="sm"
              onClick={onCameraToggle}
              className={`w-full justify-start ${
                isCameraActive 
                  ? 'bg-sky-500 hover:bg-sky-600 text-white' 
                  : 'border-sky-200 text-sky-700 hover:bg-sky-50'
              }`}
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
                className={`justify-start ${
                  showBones 
                    ? 'bg-sky-500 hover:bg-sky-600 text-white' 
                    : 'border-sky-200 text-sky-700 hover:bg-sky-50'
                }`}
              >
                {showBones ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {t('vtuber.controls.bones')}
              </Button>

              <Button
                variant={showDebug ? "default" : "outline"}
                size="sm"
                onClick={onToggleDebug}
                className={`justify-start ${
                  showDebug 
                    ? 'bg-sky-500 hover:bg-sky-600 text-white' 
                    : 'border-sky-200 text-sky-700 hover:bg-sky-50'
                }`}
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
                className="w-full justify-start border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Users className="h-4 w-4 mr-2" />
                {t('vtuber.model.manager')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAnimationLibrary}
                className="w-full justify-start border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {t('vtuber.animation.library')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenConfigManager}
                className="w-full justify-start border-sky-200 text-sky-700 hover:bg-sky-50"
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
    <div className="relative w-full h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 overflow-hidden">
      {/* 主内容区域 */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* 状态指示器 */}
      <StatusIndicator {...statusProps} />

      {/* 控制面板 */}
      <ControlPanel {...controlProps} />
    </div>
  );
}; 
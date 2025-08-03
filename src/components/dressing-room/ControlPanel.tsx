import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { useI18n } from '@/hooks/use-i18n';

interface ControlPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenArmTest?: () => void;
    onOpenHandDebug?: () => void;
    onOpenSmoothSettings?: () => void;
    mocapStatus?: any;
    onOpenSensitivityPanel?: () => void;
    onOpenModelManager?: () => void;
    onOpenAnimationLibrary?: () => void;
    onOpenConfigManager?: () => void;
    selectedAnimation?: any;
    showBones?: boolean;
    onToggleBones?: () => void;
    showArmAxes?: boolean;
    onToggleArmAxes?: () => void;
    axisSettings?: any;
    onAxisAdjustment?: any;
    cameraSettings?: any;
    onCameraSettingsChange?: any;
    debugSettings?: any;
    onDebugSettingsChange?: any;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    isOpen, 
    onClose, 
    onOpenArmTest, 
    onOpenHandDebug, 
    onOpenSmoothSettings,
    mocapStatus,
    onOpenSensitivityPanel,
    onOpenModelManager,
    onOpenAnimationLibrary,
    onOpenConfigManager,
    selectedAnimation,
    showBones,
    onToggleBones,
    showArmAxes,
    onToggleArmAxes,
    axisSettings,
    onAxisAdjustment,
    cameraSettings,
    onCameraSettingsChange,
    debugSettings,
    onDebugSettingsChange
}) => {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('mocap');

    return (
        <DraggablePanel
            title={`🎛️ ${t('vtuber.controls.title')}`}
            defaultPosition={{ x: 150, y: 150 }}
            minWidth={400}
            minHeight={500}
            maxWidth={600}
            maxHeight={700}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={80}
        >
            <div className="p-4 h-full flex flex-col">
                {/* 标签页导航 */}
                <div className="flex border-b border-gray-200 mb-4">
                    {[
                        { id: 'mocap', label: t('vtuber.controls.mocapStatus'), icon: '📹' },
                        { id: 'camera', label: t('vtuber.controls.cameraSettings'), icon: '📷' },
                        { id: 'debug', label: t('vtuber.controls.debugOptions'), icon: '🐛' },
                        { id: 'quick', label: t('vtuber.controls.quickActions'), icon: '⚡' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="mr-1">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                    {/* 动捕状态标签页 */}
                    {activeTab === 'mocap' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.mocapStatus')}</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.face ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.face ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{t('vtuber.controls.face')}</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.pose ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.pose ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{t('vtuber.controls.pose')}</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.leftHand ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.leftHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{t('vtuber.controls.leftHand')}</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.rightHand ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.rightHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>{t('vtuber.controls.rightHand')}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.animation.current')}</h4>
                                <div className="text-xs text-gray-600">
                                    {selectedAnimation ? (
                                        <div className="bg-blue-50 p-2 rounded">
                                            <div className="font-medium">{selectedAnimation.name}</div>
                                            <div className="text-gray-500">{selectedAnimation.description}</div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">{t('vtuber.animation.noAnimationSelected')}</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">{t('vtuber.controls.quickActions')}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={onOpenModelManager}
                                        className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        {t('vtuber.model.manager')}
                                    </button>
                                    <button
                                        onClick={onOpenAnimationLibrary}
                                        className="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    >
                                        {t('vtuber.animation.library')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 相机设置标签页 */}
                    {activeTab === 'camera' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.cameraControl')}</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.enableUserControl}
                                            onChange={(e) => onCameraSettingsChange('enableUserControl', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.enableUserControl')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.enableAutoTrack}
                                            onChange={(e) => onCameraSettingsChange('enableAutoTrack', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.autoTrack')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.showHint}
                                            onChange={(e) => onCameraSettingsChange('showHint', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.showHint')}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.mouseControl')}</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useLeftMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useLeftMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.leftMouseRotate')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useRightMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useRightMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.rightMousePan')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useMiddleMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useMiddleMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.middleMouseZoom')}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 调试选项标签页 */}
                    {activeTab === 'debug' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.debugOptions')}</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={showBones}
                                            onChange={onToggleBones}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.showBones')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={showArmAxes}
                                            onChange={onToggleArmAxes}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.showArmAxes')}</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={debugSettings?.showDebug}
                                            onChange={(e) => onDebugSettingsChange('showDebug', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>{t('vtuber.controls.showDebug')}</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.debugTools')}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={onOpenSensitivityPanel}
                                        className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        {t('vtuber.controls.sensitivity')}
                                    </button>
                                    <button
                                        onClick={onOpenConfigManager}
                                        className="px-3 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                    >
                                        {t('vtuber.controls.config')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 快速操作标签页 */}
                    {activeTab === 'quick' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">{t('vtuber.controls.quickActions')}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={onOpenModelManager}
                                        className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        {t('vtuber.model.manager')}
                                    </button>
                                    <button
                                        onClick={onOpenAnimationLibrary}
                                        className="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    >
                                        {t('vtuber.animation.library')}
                                    </button>
                                    <button
                                        onClick={onOpenSensitivityPanel}
                                        className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        {t('vtuber.controls.sensitivity')}
                                    </button>
                                    <button
                                        onClick={onOpenConfigManager}
                                        className="px-3 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                    >
                                        {t('vtuber.controls.config')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DraggablePanel>
    );
}; 
import React, { useState, useEffect } from 'react';

export const ArmDebugPanel = ({ 
  onAxisChange, 
  riggedPose, 
  currentSettings,
  showPanel = true,
  // 新增手部相关props
  onHandAxisChange,
  riggedLeftHand,
  riggedRightHand,
  handDebugAxisConfig
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [axisConfig, setAxisConfig] = useState({
    leftArm: { x: -1, y: 1, z: -1 },
    rightArm: { x: -1, y: 1, z: -1 },
    leftLowerArm: { x: -1, y: 1, z: -1 },
    rightLowerArm: { x: -1, y: 1, z: -1 }
  });

  // 新增手部配置状态
  const [handAxisConfig, setHandAxisConfig] = useState({
    leftHand: { x: -1, y: 1, z: -1 },
    rightHand: { x: -1, y: 1, z: -1 },
    // 左手手指
    leftThumb: { x: -1, y: -1, z: 1 },
    leftThumbMetacarpal: { x: -1, y: -1, z: 1 },
    leftThumbDistal: { x: -1, y: -1, z: 1 },
    leftIndex: { x: -1, y: -1, z: 1 },
    leftIndexIntermediate: { x: -1, y: -1, z: 1 },
    leftIndexDistal: { x: -1, y: -1, z: 1 },
    leftMiddle: { x: -1, y: -1, z: 1 },
    leftMiddleIntermediate: { x: -1, y: -1, z: 1 },
    leftMiddleDistal: { x: -1, y: -1, z: 1 },
    leftRing: { x: -1, y: -1, z: 1 },
    leftRingIntermediate: { x: -1, y: -1, z: 1 },
    leftRingDistal: { x: -1, y: -1, z: 1 },
    leftLittle: { x: -1, y: -1, z: 1 },
    leftLittleIntermediate: { x: -1, y: -1, z: 1 },
    leftLittleDistal: { x: -1, y: -1, z: 1 },
    // 右手手指
    rightThumb: { x: -1, y: -1, z: 1 },
    rightThumbMetacarpal: { x: -1, y: -1, z: 1 },
    rightThumbDistal: { x: -1, y: -1, z: 1 },
    rightIndex: { x: -1, y: -1, z: 1 },
    rightIndexIntermediate: { x: -1, y: -1, z: 1 },
    rightIndexDistal: { x: -1, y: -1, z: 1 },
    rightMiddle: { x: -1, y: -1, z: 1 },
    rightMiddleIntermediate: { x: -1, y: -1, z: 1 },
    rightMiddleDistal: { x: -1, y: -1, z: 1 },
    rightRing: { x: -1, y: -1, z: 1 },
    rightRingIntermediate: { x: -1, y: -1, z: 1 },
    rightRingDistal: { x: -1, y: -1, z: 1 },
    rightLittle: { x: -1, y: -1, z: 1 },
    rightLittleIntermediate: { x: -1, y: -1, z: 1 },
    rightLittleDistal: { x: -1, y: -1, z: 1 }
  });

  // 预设方案
  const presets = [
    { name: '默认', config: { x: 1, y: 1, z: 1 } },
    { name: '翻转X', config: { x: -1, y: 1, z: 1 } },
    { name: '翻转Y', config: { x: 1, y: -1, z: 1 } },
    { name: '翻转Z', config: { x: 1, y: 1, z: -1 } },
    { name: '翻转X+Z', config: { x: -1, y: 1, z: -1 } },
    { name: '全翻转', config: { x: -1, y: -1, z: -1 } }
  ];

  // 从localStorage加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('armDebugConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setAxisConfig(parsed);
        onAxisChange(parsed);
      } catch (error) {
        console.warn('加载保存的配置失败:', error);
      }
    }
  }, [onAxisChange]);

  // 保存配置到localStorage
  const saveConfig = (config) => {
    localStorage.setItem('armDebugConfig', JSON.stringify(config));
  };

  // 保存当前配置
  const saveCurrentConfig = () => {
    const currentConfig = {
      arm: axisConfig,
      hand: handAxisConfig,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('currentDebugConfig', JSON.stringify(currentConfig));
    console.log('当前配置已保存:', currentConfig);
  };

  // 加载当前配置
  const loadCurrentConfig = () => {
    const savedConfig = localStorage.getItem('currentDebugConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.arm) {
          setAxisConfig(parsed.arm);
          onAxisChange(parsed.arm);
        }
        if (parsed.hand) {
          setHandAxisConfig(parsed.hand);
          onHandAxisChange?.(parsed.hand);
        }
        console.log('配置已加载:', parsed);
      } catch (error) {
        console.warn('加载配置失败:', error);
      }
    }
  };

  // 切换轴向值
  const toggleAxis = (armType, axis) => {
    const newConfig = {
      ...axisConfig,
      [armType]: {
        ...axisConfig[armType],
        [axis]: axisConfig[armType][axis] === 1 ? -1 : 1
      }
    };
    setAxisConfig(newConfig);
    onAxisChange(newConfig);
    saveConfig(newConfig);
  };

  // 新增：切换手部轴向值
  const toggleHandAxis = (handType, axis) => {
    const newConfig = {
      ...handAxisConfig,
      [handType]: {
        ...handAxisConfig[handType],
        [axis]: handAxisConfig[handType][axis] === 1 ? -1 : 1
      }
    };
    setHandAxisConfig(newConfig);
    onHandAxisChange?.(newConfig);
    saveHandConfig(newConfig);
  };

  // 新增：保存手部配置到localStorage
  const saveHandConfig = (config) => {
    localStorage.setItem('handDebugConfig', JSON.stringify(config));
  };

  // 应用预设
  const applyPreset = (preset) => {
    const newConfig = {
      leftArm: { ...preset.config },
      rightArm: { ...preset.config },
      leftLowerArm: { ...preset.config },
      rightLowerArm: { ...preset.config }
    };
    setAxisConfig(newConfig);
    onAxisChange(newConfig);
    saveConfig(newConfig);
  };

  // 重置配置
  const resetConfig = () => {
    const defaultConfig = {
      leftArm: { x: -1, y: 1, z: -1 },
      rightArm: { x: -1, y: 1, z: -1 },
      leftLowerArm: { x: -1, y: 1, z: -1 },
      rightLowerArm: { x: -1, y: 1, z: -1 }
    };
    setAxisConfig(defaultConfig);
    onAxisChange(defaultConfig);
    saveConfig(defaultConfig);
  };

  // 导出配置
  const exportConfig = () => {
    const dataStr = JSON.stringify(axisConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arm-debug-config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // 导入配置
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setAxisConfig(imported);
          onAxisChange(imported);
          saveConfig(imported);
        } catch (error) {
          alert('配置文件格式错误');
        }
      };
      reader.readAsText(file);
    }
  };

  // 渲染轴向控制
  const renderAxisControl = (armType, label) => {
    const config = axisConfig[armType];
    return (
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-white mb-2">{label}</h3>
        <div className="grid grid-cols-3 gap-2">
          {['x', 'y', 'z'].map((axis) => (
            <button
              key={axis}
              onClick={() => toggleAxis(armType, axis)}
              className={`px-3 py-2 text-xs font-mono rounded transition-colors ${
                config[axis] === 1
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {axis.toUpperCase()}: {config[axis]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 新增：渲染手部轴向控制
  const renderHandAxisControl = (handType, label) => {
    const config = handAxisConfig[handType];
    return (
      <div className="mb-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-white mb-2">{label}</h3>
        <div className="grid grid-cols-3 gap-2">
          {['x', 'y', 'z'].map((axis) => (
            <button
              key={axis}
              onClick={() => toggleHandAxis(handType, axis)}
              className={`px-3 py-2 text-xs font-mono rounded transition-colors ${
                config[axis] === 1
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {axis.toUpperCase()}: {config[axis]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 新增：渲染详细手指控制
  const renderDetailedFingerControl = (handType, fingerName, label) => {
    const config = handAxisConfig[handType];
    return (
      <div className="mb-2 p-2 bg-gray-700 rounded">
        <h4 className="text-xs font-semibold text-white mb-1">{label}</h4>
        <div className="grid grid-cols-3 gap-1">
          {['x', 'y', 'z'].map((axis) => (
            <button
              key={axis}
              onClick={() => toggleHandAxis(handType, axis)}
              className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                config[axis] === 1
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {axis.toUpperCase()}: {config[axis]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // 渲染数据预览
  const renderDataPreview = () => {
    if (!riggedPose?.current) {
      return (
        <div className="text-gray-400 text-xs p-2 bg-gray-800 rounded">
          等待动捕数据...
        </div>
      );
    }

    const leftArm = riggedPose.current.LeftUpperArm;
    const rightArm = riggedPose.current.RightUpperArm;

    return (
      <div className="space-y-2">
        {leftArm && (
          <div className="text-xs">
            <div className="text-green-400 font-semibold">左臂原始数据:</div>
            <div className="text-gray-300 font-mono">
              X: {leftArm.x?.toFixed(3)} Y: {leftArm.y?.toFixed(3)} Z: {leftArm.z?.toFixed(3)}
            </div>
            <div className="text-blue-400 font-semibold">处理后数据:</div>
            <div className="text-gray-300 font-mono">
              X: {(leftArm.x * axisConfig.leftArm.x)?.toFixed(3)} 
              Y: {(leftArm.y * axisConfig.leftArm.y)?.toFixed(3)} 
              Z: {(leftArm.z * axisConfig.leftArm.z)?.toFixed(3)}
            </div>
          </div>
        )}
        {rightArm && (
          <div className="text-xs">
            <div className="text-green-400 font-semibold">右臂原始数据:</div>
            <div className="text-gray-300 font-mono">
              X: {rightArm.x?.toFixed(3)} Y: {rightArm.y?.toFixed(3)} Z: {rightArm.z?.toFixed(3)}
            </div>
            <div className="text-blue-400 font-semibold">处理后数据:</div>
            <div className="text-gray-300 font-mono">
              X: {(rightArm.x * axisConfig.rightArm.x)?.toFixed(3)} 
              Y: {(rightArm.y * axisConfig.rightArm.y)?.toFixed(3)} 
              Z: {(rightArm.z * axisConfig.rightArm.z)?.toFixed(3)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 新增：渲染手部数据预览
  const renderHandDataPreview = () => {
    if (!riggedLeftHand?.current && !riggedRightHand?.current) {
      return (
        <div className="text-gray-400 text-xs p-2 bg-gray-800 rounded">
          等待手部动捕数据...
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {riggedLeftHand?.current && (
          <div className="text-xs">
            <div className="text-green-400 font-semibold">左手原始数据:</div>
            <div className="text-gray-300 font-mono">
              手腕: X: {riggedLeftHand.current.LeftWrist?.x?.toFixed(3)} Y: {riggedLeftHand.current.LeftWrist?.y?.toFixed(3)} Z: {riggedLeftHand.current.LeftWrist?.z?.toFixed(3)}
            </div>
            <div className="text-blue-400 font-semibold">处理后数据:</div>
            <div className="text-gray-300 font-mono">
              手腕: X: {(riggedLeftHand.current.LeftWrist?.x * handAxisConfig.leftHand.x)?.toFixed(3)} 
              Y: {(riggedLeftHand.current.LeftWrist?.y * handAxisConfig.leftHand.y)?.toFixed(3)} 
              Z: {(riggedLeftHand.current.LeftWrist?.z * handAxisConfig.leftHand.z)?.toFixed(3)}
            </div>
          </div>
        )}
        {riggedRightHand?.current && (
          <div className="text-xs">
            <div className="text-green-400 font-semibold">右手原始数据:</div>
            <div className="text-gray-300 font-mono">
              手腕: X: {riggedRightHand.current.RightWrist?.x?.toFixed(3)} Y: {riggedRightHand.current.RightWrist?.y?.toFixed(3)} Z: {riggedRightHand.current.RightWrist?.z?.toFixed(3)}
            </div>
            <div className="text-blue-400 font-semibold">处理后数据:</div>
            <div className="text-gray-300 font-mono">
              手腕: X: {(riggedRightHand.current.RightWrist?.x * handAxisConfig.rightHand.x)?.toFixed(3)} 
              Y: {(riggedRightHand.current.RightWrist?.y * handAxisConfig.rightHand.y)?.toFixed(3)} 
              Z: {(riggedRightHand.current.RightWrist?.z * handAxisConfig.rightHand.z)?.toFixed(3)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!showPanel) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 折叠/展开按钮 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
        title={isCollapsed ? '展开调试面板' : '折叠调试面板'}
      >
        {isCollapsed ? '🔧' : '✕'}
      </button>

      {/* 主面板 */}
      {!isCollapsed && (
        <div className="w-80 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700 max-h-96 overflow-y-auto">
          {/* 标题栏 */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">ARM & 手部坐标轴调试</h2>
              <div className="flex space-x-2">
                <button
                  onClick={saveCurrentConfig}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  title="保存当前配置"
                >
                  保存
                </button>
                <button
                  onClick={loadCurrentConfig}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  title="加载保存的配置"
                >
                  加载
                </button>
                <button
                  onClick={exportConfig}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  title="导出配置"
                >
                  导出
                </button>
                <label className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded cursor-pointer">
                  导入
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfig}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-4 space-y-4">
            {/* 预设方案 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">预设方案</h3>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <button
                onClick={resetConfig}
                className="mt-2 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                重置配置
              </button>
            </div>

            {/* 手臂轴向控制 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">手臂轴向控制</h3>
              {renderAxisControl('leftArm', '左臂 (上臂)')}
              {renderAxisControl('rightArm', '右臂 (上臂)')}
              {renderAxisControl('leftLowerArm', '左臂 (前臂)')}
              {renderAxisControl('rightLowerArm', '右臂 (前臂)')}
            </div>

            {/* 手部轴向控制 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">手部轴向控制</h3>
              {renderHandAxisControl('leftHand', '左手 (手掌)')}
              {renderHandAxisControl('rightHand', '右手 (手掌)')}
            </div>

            {/* 详细手指控制 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">详细手指控制</h3>
              
              {/* 左手手指 */}
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">左手手指</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">拇指</h5>
                    {renderDetailedFingerControl('leftThumb', 'leftThumb', '拇指近节')}
                    {renderDetailedFingerControl('leftThumbMetacarpal', 'leftThumbMetacarpal', '拇指中节')}
                    {renderDetailedFingerControl('leftThumbDistal', 'leftThumbDistal', '拇指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">食指</h5>
                    {renderDetailedFingerControl('leftIndex', 'leftIndex', '食指近节')}
                    {renderDetailedFingerControl('leftIndexIntermediate', 'leftIndexIntermediate', '食指中节')}
                    {renderDetailedFingerControl('leftIndexDistal', 'leftIndexDistal', '食指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">中指</h5>
                    {renderDetailedFingerControl('leftMiddle', 'leftMiddle', '中指近节')}
                    {renderDetailedFingerControl('leftMiddleIntermediate', 'leftMiddleIntermediate', '中指中节')}
                    {renderDetailedFingerControl('leftMiddleDistal', 'leftMiddleDistal', '中指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">无名指</h5>
                    {renderDetailedFingerControl('leftRing', 'leftRing', '无名指近节')}
                    {renderDetailedFingerControl('leftRingIntermediate', 'leftRingIntermediate', '无名指中节')}
                    {renderDetailedFingerControl('leftRingDistal', 'leftRingDistal', '无名指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">小指</h5>
                    {renderDetailedFingerControl('leftLittle', 'leftLittle', '小指近节')}
                    {renderDetailedFingerControl('leftLittleIntermediate', 'leftLittleIntermediate', '小指中节')}
                    {renderDetailedFingerControl('leftLittleDistal', 'leftLittleDistal', '小指远节')}
                  </div>
                </div>
              </div>

              {/* 右手手指 */}
              <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-green-300 mb-2">右手手指</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">拇指</h5>
                    {renderDetailedFingerControl('rightThumb', 'rightThumb', '拇指近节')}
                    {renderDetailedFingerControl('rightThumbMetacarpal', 'rightThumbMetacarpal', '拇指中节')}
                    {renderDetailedFingerControl('rightThumbDistal', 'rightThumbDistal', '拇指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">食指</h5>
                    {renderDetailedFingerControl('rightIndex', 'rightIndex', '食指近节')}
                    {renderDetailedFingerControl('rightIndexIntermediate', 'rightIndexIntermediate', '食指中节')}
                    {renderDetailedFingerControl('rightIndexDistal', 'rightIndexDistal', '食指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">中指</h5>
                    {renderDetailedFingerControl('rightMiddle', 'rightMiddle', '中指近节')}
                    {renderDetailedFingerControl('rightMiddleIntermediate', 'rightMiddleIntermediate', '中指中节')}
                    {renderDetailedFingerControl('rightMiddleDistal', 'rightMiddleDistal', '中指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">无名指</h5>
                    {renderDetailedFingerControl('rightRing', 'rightRing', '无名指近节')}
                    {renderDetailedFingerControl('rightRingIntermediate', 'rightRingIntermediate', '无名指中节')}
                    {renderDetailedFingerControl('rightRingDistal', 'rightRingDistal', '无名指远节')}
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300 mb-1">小指</h5>
                    {renderDetailedFingerControl('rightLittle', 'rightLittle', '小指近节')}
                    {renderDetailedFingerControl('rightLittleIntermediate', 'rightLittleIntermediate', '小指中节')}
                    {renderDetailedFingerControl('rightLittleDistal', 'rightLittleDistal', '小指远节')}
                  </div>
                </div>
              </div>
            </div>

            {/* 数据预览 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">实时数据</h3>
              <div className="bg-gray-800 rounded p-3">
                {renderDataPreview()}
              </div>
            </div>

            {/* 手部数据预览 */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">手部实时数据</h3>
              <div className="bg-gray-800 rounded p-3">
                {renderHandDataPreview()}
              </div>
            </div>

            {/* 使用说明 */}
            <div className="text-xs text-gray-400 bg-gray-800 rounded p-3">
              <div className="font-semibold mb-1">使用说明:</div>
              <div>1. 开启摄像头开始动捕</div>
              <div>2. 举起手臂和手掌观察模型响应</div>
              <div>3. 发现方向错误时点击对应轴向按钮</div>
              <div>4. 实时看到修正效果</div>
              <div>5. 找到正确配置后保存</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
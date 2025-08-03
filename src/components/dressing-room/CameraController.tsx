// src/components/CameraController.jsx - 修复版本
import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';

// VRM 引用处理工具
const getVRMPosition = (vrmRef: any) => {
    if (!vrmRef?.current) {
        return null;
    }
    
    const scene = vrmRef.current;
    if (!scene) {
        return null;
    }
    
    const position = new Vector3();
    scene.getWorldPosition(position);
    return position;
};

// 相机控制提示组件
export const CameraControlHint = ({ isVisible = true }) => {
    const [hintVisible, setHintVisible] = useState(true);
    
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setHintVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);
    
    if (!isVisible || !hintVisible) return null;
    
    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🖱️</span>
                    <span>鼠标拖拽旋转视角</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-green-400">🔍</span>
                    <span>滚轮缩放</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">🎯</span>
                    <span>始终面对角色</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-purple-400">🔄</span>
                    <span>双击重置视角</span>
                </div>
            </div>
        </div>
    );
};

// 主相机控制器组件 - 修复版本
interface CameraControllerProps {
  vrmRef: any;
  enableAutoTrack?: boolean;
  enableUserControl?: boolean;
  showHint?: boolean;
  useGameStyle?: boolean;
  cameraSettings?: any;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  vrmRef,
  enableAutoTrack = true,
  enableUserControl = true,
  showHint = true,
  useGameStyle = true,
  cameraSettings = {}
}) => {
    return (
        <>
            {/* 标准OrbitControls - 始终面对角色 */}
            {enableUserControl && (
                <OrbitControls
                    // 基础设置
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    
                    // 目标点 - 降低高度，更接近VRM中心
                    target={[0, 0.5, 0]}
                    
                    // 距离限制
                    minDistance={cameraSettings.minDistance || 1.5}
                    maxDistance={cameraSettings.maxDistance || 15}
                    
                    // 垂直角度限制
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2}
                    
                    // 阻尼设置 - 增加平滑效果
                    enableDamping={true}
                    dampingFactor={cameraSettings.dampingFactor || 0.1}
                    
                    // 速度设置 - 降低速度增加平滑
                    rotateSpeed={cameraSettings.rotateSpeed || 0.3}
                    zoomSpeed={cameraSettings.zoomSpeed || 0.5}
                    panSpeed={cameraSettings.panSpeed || 0.5}
                    
                    // 重要：这会让 OrbitControls 成为默认控制器
                    makeDefault
                />
            )}
        </>
    );
};
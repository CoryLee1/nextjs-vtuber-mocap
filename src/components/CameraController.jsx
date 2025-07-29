import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';

// 扩展 OrbitControls 为 JSX 元素
extend({ OrbitControls });

// 注意：如果使用 TypeScript，还需要扩展 JSX 命名空间：
// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       orbitControls: any;
//     }
//   }
// }

// VRM 引用处理工具
const getVRMPosition = (vrmRef) => {
    if (!vrmRef?.current) {
        console.warn('getVRMPosition: vrmRef.current 为空');
        return null;
    }
    
    // 尝试获取scene对象
    const scene = vrmRef.current;
    if (!scene) {
        console.warn('getVRMPosition: scene 为空');
        return null;
    }
    
    const position = new Vector3();
    scene.getWorldPosition(position);
    
    console.log('getVRMPosition: 获取位置成功', position.toArray());
    return position;
};

// 相机控制提示组件
export const CameraControlHint = ({ isVisible = true }) => {
    const [hintVisible, setHintVisible] = useState(true);
    
    // 5秒后隐藏提示
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
                    <span>自动跟踪角色</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-purple-400">🔄</span>
                    <span>双击重置视角</span>
                </div>
            </div>
        </div>
    );
};

// 增强版智能相机组件 - 参考Unity实现
export const SmartCamera = ({ 
    vrmRef, 
    enableAutoTrack = true,
    autoTrackSpeed = 0.02,
    lookAtSmoothFactor = 0.03,
    swingAmplitude = 2,
    swingSpeed = 0.0005,
    // 新增：游戏风格控制参数
    rotationSpeed = 3.5,
    rotationDampening = 10.0,
    zoomSpeed = 4.0,
    zoomDampening = 6.0,
    minDistance = 1.5,
    maxDistance = 15,
    yMinLimit = -40,
    yMaxLimit = 85,
    enableBreathing = false,
    breathingAmplitude = 0.03,
    breathingFrequency = 0.8,
    enableCollisionDetection = true,
    collisionOffset = 0.3
}) => {
    const { camera } = useThree();
    const targetPosition = useRef(new Vector3(0, 1.5, 4));
    const currentPosition = useRef(new Vector3(0, 2.5, 4));
    const targetLookAt = useRef(new Vector3(0, 1.5, 0));
    const currentLookAt = useRef(new Vector3(0, 1.5, 0));
    
    // 新增：游戏风格控制变量
    const currentX = useRef(0);
    const currentY = useRef(20);
    const targetX = useRef(0);
    const targetY = useRef(20);
    const currentDistance = useRef(5);
    const targetDistance = useRef(5);
    const breathingOffset = useRef(0);
    const previousPosition = useRef(new Vector3());
    
    useFrame((state, delta) => {
        if (!vrmRef?.current || !enableAutoTrack) return;
        
        // 使用工具函数获取VRM位置
        const vrmPosition = getVRMPosition(vrmRef);
        if (!vrmPosition) return;
        
        // 计算理想的相机位置 - 使用数组形式而不是new Vector3()
        const idealPosition = [
            vrmPosition.x + swingAmplitude * Math.sin(Date.now() * swingSpeed),
            vrmPosition.y + 1.5,
            vrmPosition.z + 4
        ];
        
        // 平滑更新目标位置
        targetPosition.current.lerp(new Vector3(...idealPosition), 0.01);
        
        // 平滑更新相机位置
        currentPosition.current.lerp(targetPosition.current, autoTrackSpeed);
        camera.position.copy(currentPosition.current);
        
        // 计算理想的观察点 - 使用数组形式
        const idealLookAt = [
            vrmPosition.x,
            vrmPosition.y + 1.2, // 头部高度
            vrmPosition.z
        ];
        
        // 平滑更新观察点
        targetLookAt.current.lerp(new Vector3(...idealLookAt), 0.01);
        currentLookAt.current.lerp(targetLookAt.current, lookAtSmoothFactor);
        
        // 让相机看向角色
        camera.lookAt(currentLookAt.current);
        
        // 更新OrbitControls的目标点
        if (window.orbitControls) {
            window.orbitControls.target.copy(currentLookAt.current);
        }
        
        // 应用呼吸效果
        if (enableBreathing) {
            breathingOffset.current = breathingAmplitude * Math.sin(Date.now() * breathingFrequency * Math.PI * 0.001);
        } else {
            breathingOffset.current = 0;
        }
        
        // 更新移动速度用于动态FOV
        const movementSpeed = currentPosition.current.distanceTo(previousPosition.current) / delta;
        previousPosition.current.copy(currentPosition.current);
    });
    
    return null;
};

// 游戏风格相机控制器组件
export const GameStyleCameraController = ({ 
    vrmRef,
    enableAutoTrack = true,
    enableUserControl = true,
    showHint = true,
    cameraSettings = {
        // 基础设置
        autoTrackSpeed: 0.02,
        lookAtSmoothFactor: 0.03,
        swingAmplitude: 2,
        swingSpeed: 0.0005,
        
        // 游戏风格控制
        rotationSpeed: 3.5,
        rotationDampening: 10.0,
        zoomSpeed: 4.0,
        zoomDampening: 6.0,
        minDistance: 1.5,
        maxDistance: 15,
        yMinLimit: -40,
        yMaxLimit: 85,
        
        // 视觉效果
        enableBreathing: false,
        breathingAmplitude: 0.03,
        breathingFrequency: 0.8,
        
        // 碰撞检测
        enableCollisionDetection: true,
        collisionOffset: 0.3,
        
        // 输入设置
        useRightMouseButton: true,
        useLeftMouseButton: true,
        useMiddleMouseButton: true,
        invertY: false,
        
        // 阻尼设置
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
        zoomSpeed: 0.8,
        panSmoothing: 10
    }
}) => {
    const { camera } = useThree();
    
    // 游戏风格控制状态
    const [inputEnabled, setInputEnabled] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [isZooming, setIsZooming] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    
    // 相机状态 - 使用默认目标位置
    const currentX = useRef(0);
    const currentY = useRef(20);
    const targetX = useRef(0);
    const targetY = useRef(20);
    const currentDistance = useRef(5);
    const targetDistance = useRef(5);
    const targetPanOffset = useRef(new Vector3());
    const currentPanOffset = useRef(new Vector3());
    
    // 默认目标位置（VRM通常在这个位置）
    const defaultTarget = useRef(new Vector3(0, 1.5, 0));
    
    // 添加调试信息
    useEffect(() => {
        console.log('GameStyleCameraController: 组件初始化', {
            vrmRef: !!vrmRef?.current,
            enableAutoTrack,
            enableUserControl,
            inputEnabled,
            camera: !!camera,
            cameraSettings: {
                useLeftMouseButton: cameraSettings.useLeftMouseButton,
                useRightMouseButton: cameraSettings.useRightMouseButton,
                useMiddleMouseButton: cameraSettings.useMiddleMouseButton
            }
        });
    }, [vrmRef, enableAutoTrack, enableUserControl, inputEnabled, cameraSettings, camera]);
    
    // 处理鼠标输入
    useEffect(() => {
        // 添加全局鼠标事件测试
        const testMouseEvent = (event) => {
            console.log('全局鼠标事件测试:', event.type, event.button, event.movementX, event.movementY);
        };
        
        document.addEventListener('mousedown', testMouseEvent);
        document.addEventListener('mousemove', testMouseEvent);
        document.addEventListener('mouseup', testMouseEvent);
        
        const handleMouseDown = (event) => {
            console.log('鼠标按下:', event.button, 'inputEnabled:', inputEnabled);
            if (!inputEnabled) return;
            
            // 左键旋转
            if (event.button === 0 && cameraSettings.useLeftMouseButton) {
                console.log('开始左键旋转');
                setIsRotating(true);
            }
            // 右键旋转
            else if (event.button === 2 && cameraSettings.useRightMouseButton) {
                console.log('开始右键旋转');
                setIsRotating(true);
            }
            // 中键平移
            else if (event.button === 1 && cameraSettings.useMiddleMouseButton) {
                console.log('开始中键平移');
                setIsPanning(true);
            }
        };
        
        const handleMouseUp = (event) => {
            console.log('鼠标释放:', event.button);
            setIsRotating(false);
            setIsZooming(false);
            setIsPanning(false);
        };
        
        const handleMouseMove = (event) => {
            if (!inputEnabled) return;
            
            const deltaX = event.movementX || 0;
            const deltaY = event.movementY || 0;
            
            if (isRotating && (deltaX !== 0 || deltaY !== 0)) {
                console.log('旋转中:', deltaX, deltaY);
                // 应用旋转
                targetX.current += deltaX * cameraSettings.rotationSpeed * 0.01;
                targetY.current += deltaY * cameraSettings.rotationSpeed * 0.01 * (cameraSettings.invertY ? 1 : -1);
                
                // 限制垂直旋转
                targetY.current = Math.max(cameraSettings.yMinLimit, Math.min(cameraSettings.yMaxLimit, targetY.current));
            }
            
            if (isPanning && (deltaX !== 0 || deltaY !== 0)) {
                console.log('平移中:', deltaX, deltaY);
                // 应用平移
                const panSpeed = 0.01 * currentDistance.current;
                targetPanOffset.current.x -= deltaX * panSpeed;
                targetPanOffset.current.y += deltaY * panSpeed;
            }
        };
        
        const handleWheel = (event) => {
            if (!inputEnabled) return;
            
            console.log('滚轮事件:', event.deltaY);
            event.preventDefault();
            const zoomDelta = event.deltaY * cameraSettings.zoomSpeed * 0.01;
            targetDistance.current = Math.max(
                cameraSettings.minDistance,
                Math.min(cameraSettings.maxDistance, targetDistance.current + zoomDelta)
            );
        };
        
        // 双击重置
        const handleDoubleClick = () => {
            console.log('双击重置视角');
            targetX.current = 0;
            targetY.current = 20;
            targetDistance.current = 5;
            targetPanOffset.current.set(0, 0, 0);
        };
        
        // 添加事件监听器
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('wheel', handleWheel);
        document.addEventListener('dblclick', handleDoubleClick);
        
        // 防止右键菜单
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        console.log('游戏风格相机控制器已初始化，inputEnabled:', inputEnabled);
        
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('wheel', handleWheel);
            document.removeEventListener('dblclick', handleDoubleClick);
            
            // 移除测试事件监听器
            document.removeEventListener('mousedown', testMouseEvent);
            document.removeEventListener('mousemove', testMouseEvent);
            document.removeEventListener('mouseup', testMouseEvent);
        };
    }, [inputEnabled, cameraSettings, isRotating, isPanning]);
    
    // 相机更新循环
    useFrame((state, delta) => {
        // 获取目标位置（VRM位置或默认位置）
        const vrmPosition = getVRMPosition(vrmRef);
        const targetPosition = vrmPosition || defaultTarget.current;
        
        // 平滑插值
        currentX.current = MathUtils.lerp(currentX.current, targetX.current, delta * cameraSettings.rotationDampening);
        currentY.current = MathUtils.lerp(currentY.current, targetY.current, delta * cameraSettings.rotationDampening);
        currentDistance.current = MathUtils.lerp(currentDistance.current, targetDistance.current, delta * cameraSettings.zoomDampening);
        currentPanOffset.current.lerp(targetPanOffset.current, delta * cameraSettings.panSmoothing || 10);
        
        // 计算旋转
        const rotation = new Vector3(currentY.current, currentX.current, 0);
        
        // 计算位置
        const negDistance = new Vector3(0, 0, -currentDistance.current);
        const position = targetPosition.clone().add(currentPanOffset.current).add(negDistance);
        
        // 应用位置和旋转
        camera.position.copy(position);
        camera.lookAt(targetPosition.clone().add(currentPanOffset.current));
        
        // 更新OrbitControls（如果存在）
        if (window.orbitControls) {
            window.orbitControls.target.copy(targetPosition.clone().add(currentPanOffset.current));
        }
        
        // 调试信息（每60帧显示一次）
        if (state.clock.elapsedTime % 1 < 0.016) { // 大约每秒一次
            console.log('GameStyleCameraController: 相机更新', {
                position: position.toArray(),
                target: targetPosition.toArray(),
                distance: currentDistance.current,
                rotation: [currentX.current, currentY.current],
                hasVRM: !!vrmPosition,
                cameraPosition: camera.position.toArray()
            });
        }
    });
    
    return null;
};

// 主相机控制器组件
export const CameraController = ({ 
    vrmRef,
    enableAutoTrack = true,
    enableUserControl = true,
    showHint = true,
    useGameStyle = true, // 新增：是否使用游戏风格控制
    cameraSettings = {
        autoTrackSpeed: 0.02,
        lookAtSmoothFactor: 0.03,
        swingAmplitude: 2,
        swingSpeed: 0.0005,
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
        zoomSpeed: 0.8,
        minDistance: 1.5,
        maxDistance: 8,
        // 游戏风格设置
        rotationSpeed: 3.5,
        rotationDampening: 10.0,
        zoomDampening: 6.0,
        yMinLimit: -40,
        yMaxLimit: 85,
        useRightMouseButton: true,
        useLeftMouseButton: true,
        useMiddleMouseButton: true,
        invertY: false,
        enableBreathing: false,
        breathingAmplitude: 0.03,
        breathingFrequency: 0.8,
        enableCollisionDetection: true,
        collisionOffset: 0.3,
        panSmoothing: 10
    }
}) => {
    // 添加调试信息
    useEffect(() => {
        console.log('CameraController: 主控制器初始化', {
            vrmRef: !!vrmRef?.current,
            enableAutoTrack,
            enableUserControl,
            useGameStyle,
            showHint
        });
    }, [vrmRef, enableAutoTrack, enableUserControl, useGameStyle, showHint]);
    
    return (
        <>
            {/* 游戏风格相机控制器 */}
            {useGameStyle && enableUserControl && (
                <GameStyleCameraController 
                    vrmRef={vrmRef}
                    enableAutoTrack={enableAutoTrack}
                    cameraSettings={cameraSettings}
                />
            )}
            
            {/* 智能相机 */}
            <SmartCamera 
                vrmRef={vrmRef}
                enableAutoTrack={enableAutoTrack}
                autoTrackSpeed={cameraSettings.autoTrackSpeed}
                lookAtSmoothFactor={cameraSettings.lookAtSmoothFactor}
                swingAmplitude={cameraSettings.swingAmplitude}
                swingSpeed={cameraSettings.swingSpeed}
                rotationSpeed={cameraSettings.rotationSpeed}
                rotationDampening={cameraSettings.rotationDampening}
                zoomSpeed={cameraSettings.zoomSpeed}
                zoomDampening={cameraSettings.zoomDampening}
                minDistance={cameraSettings.minDistance}
                maxDistance={cameraSettings.maxDistance}
                yMinLimit={cameraSettings.yMinLimit}
                yMaxLimit={cameraSettings.yMaxLimit}
                enableBreathing={cameraSettings.enableBreathing}
                breathingAmplitude={cameraSettings.breathingAmplitude}
                breathingFrequency={cameraSettings.breathingFrequency}
                enableCollisionDetection={cameraSettings.enableCollisionDetection}
                collisionOffset={cameraSettings.collisionOffset}
            />
            
            {/* 测试立方体 - 确认相机控制器被渲染 */}
            <mesh position={[3, 0, 0]}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshBasicMaterial color="blue" />
            </mesh>
            
            {/* 传统OrbitControls（备用） */}
            {!useGameStyle && enableUserControl && (
                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    enableRotate={true}
                    maxPolarAngle={Math.PI / 2}
                    minDistance={cameraSettings.minDistance}
                    maxDistance={cameraSettings.maxDistance}
                    target={[0, 1.5, 0]} // 使用数组形式
                    dampingFactor={cameraSettings.dampingFactor}
                    enableDamping={true}
                    rotateSpeed={cameraSettings.rotateSpeed}
                    zoomSpeed={cameraSettings.zoomSpeed}
                    onCreated={(controls) => {
                        window.orbitControls = controls;
                    }}
                    onStart={() => {
                        console.log('用户开始控制相机');
                    }}
                    onEnd={() => {
                        console.log('用户停止控制相机');
                    }}
                />
            )}
        </>
    );
}; 
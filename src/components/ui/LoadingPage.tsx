'use client';

import { useEffect, useRef } from 'react';

interface LoadingPageProps {
  onComplete?: () => void;
}

export default function LoadingPage({ onComplete }: LoadingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 动态加载p5.js
    const loadP5 = () => {
      if (window.p5) {
        initP5App();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/p5@1.11.8/lib/p5.js';
      script.onload = () => {
        initP5App();
      };
      document.head.appendChild(script);
    };

    const initP5App = () => {
      if (!containerRef.current) return;

      // 清除之前的实例
      if (containerRef.current.children.length > 0) {
        containerRef.current.innerHTML = '';
      }

      // 创建HTML结构，完全按照原HTML
      const container = document.createElement('div');
      container.className = 'container';
      container.style.cssText = `
        max-width: 100vw;
        margin: 0 auto;
        position: relative;
      `;

      const canvasContainer = document.createElement('div');
      canvasContainer.className = 'canvas-container';
      canvasContainer.style.cssText = `
        position: relative;
        width: 100vw;
        height: 100vh;
      `;

      const mainCanvas = document.createElement('div');
      mainCanvas.className = 'main-canvas';
      mainCanvas.id = 'canvas2';
      mainCanvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1;
      `;

      canvasContainer.appendChild(mainCanvas);
      container.appendChild(canvasContainer);
      containerRef.current.appendChild(container);

      // 执行完全相同的JavaScript代码（包裹在 IIFE 中避免全局变量冲突）
      const p5Script = `(function(){
        // 全局变量
        let originalFrames = [];
        let backgroundVideo;
        let currentFrame = 0;
        let isPlaying = true; // 默认自动播放
        let canvasWidth, canvasHeight;
        let videoFitMode = 'contain'; // 默认完整显示
        let frameRate = 30;
        let lastFrameTime = 0;
        let frameInterval = 1000 / frameRate;
        let mousePixelSize = 8; // 鼠标控制的像素大小（现在改为Loading控制）
        let currentFrameImg = null; // 当前帧图像
        let framePixels = null; // 当前帧像素数据
        let lastProcessedFrame = -1; // 记录上次处理的帧，避免重复加载像素数据
        let customFont; // 自定义字体
        let loadingProgress = 0; // 加载进度
        let isLoading = true; // 是否正在加载
        let targetBackgroundColor = {r: 0, g: 0, b: 255}; // 目标蓝色
        let currentBackgroundColor = {r: 240, g: 240, b: 252}; // 当前浅蓝紫色
        let finalTransitionProgress = 0; // 99%-100%阶段的过渡进度

        function updateCanvasSize() {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            resizeCanvas(canvasWidth, canvasHeight);
        }

        // 工具函数 - 必须在setup之前定义
        function calculateVideoDrawParams() {
            if (!backgroundVideo) return null;
            
            // 直接撑满整个视窗，不保持比例
            return { 
                x: 0, 
                y: 0, 
                width: canvasWidth, 
                height: canvasHeight 
            };
        }

        // 自动加载PNG序列
        async function loadPNGSequence() {
            originalFrames = [];
            let loadedCount = 0;
            
            try {
                // 从opening1_2000.png到opening1_2133.png
                for (let i = 2000; i <= 2133; i++) {
                    try {
                        // 使用正确的路径
                        const img = await loadImageAsync(\`/project-resources/opening1_\${i}.png\`);
                        originalFrames.push(img);
                        loadedCount++;
                        
                        // 每加载10个文件显示一次进度
                        if (loadedCount % 10 === 0) {
                            console.log(\`已加载 \${loadedCount}/134 帧\`);
                        }
                    } catch (error) {
                        console.log(\`加载图片失败: opening1_\${i}.png\`, error);
                    }
                }
                
                console.log(\`成功加载 \${loadedCount} 帧PNG序列\`);
                return loadedCount > 0;
            } catch (error) {
                console.log('加载PNG序列时出错:', error);
                return false;
            }
        }

        // 异步加载图片的辅助函数
        function loadImageAsync(src) {
            return new Promise((resolve, reject) => {
                loadImage(src, img => {
                    if (img) {
                        resolve(img);
                    } else {
                        reject(new Error(\`Failed to load image: \${src}\`));
                    }
                });
            });
        }

        // 自动加载背景视频
        async function loadBackgroundVideo() {
            try {
                console.log('开始加载背景视频...');
                
                // 尝试多个可能的视频文件路径
                const videoPaths = [
                    '/project-resources/6130625_Skyscrapers Japan Shibuya City_By_21_Aerials_Artlist_HD.mp4'
                ];
                
                for (let i = 0; i < videoPaths.length; i++) {
                    try {
                        console.log(\`尝试加载视频: \${videoPaths[i]}\`);
                        
                        // 创建视频元素
                        backgroundVideo = createVideo(videoPaths[i]);
                        
                        // 等待视频加载
                        await new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('视频加载超时'));
                            }, 15000); // 15秒超时
                            
                            backgroundVideo.elt.addEventListener('loadeddata', () => {
                                clearTimeout(timeout);
                                console.log('视频数据已加载，尺寸:', backgroundVideo.videoWidth, 'x', backgroundVideo.videoHeight);
                                resolve();
                            });
                            
                            backgroundVideo.elt.addEventListener('canplay', () => {
                                console.log('视频可以播放');
                            });
                            
                            backgroundVideo.elt.addEventListener('error', (e) => {
                                clearTimeout(timeout);
                                console.error('视频加载错误:', e);
                                console.error('错误详情:', backgroundVideo.elt.error);
                                reject(e);
                            });
                        });
                        
                        // 设置视频属性
                        backgroundVideo.loop();
                        backgroundVideo.play();
                        backgroundVideo.hide(); // 隐藏原始视频元素
                        
                        console.log(\`成功加载视频: \${videoPaths[i]}\`);
                        return true;
                        
                    } catch (error) {
                        console.log(\`视频 \${videoPaths[i]} 加载失败:\`, error);
                        if (backgroundVideo) {
                            backgroundVideo.remove();
                            backgroundVideo = null;
                        }
                        continue; // 尝试下一个视频
                    }
                }
                
                console.log('所有视频文件都加载失败');
                return false;
                
            } catch (error) {
                console.log('背景视频加载失败:', error);
                return false;
            }
        }

        // 鼠标移动控制像素大小（现在改为Loading控制）
        function mouseMoved() {
            // 不再使用鼠标控制，改为Loading进度控制
            // mousePixelSize = map(mouseX, 0, width, 2, 32);
        }

        function setup() {
            // 初始化全屏canvas尺寸
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            
            createCanvas(canvasWidth, canvasHeight);
            
            let mainCanvas = select('canvas');
            mainCanvas.parent('canvas2');

            // 监听窗口大小变化
            window.addEventListener('resize', updateCanvasSize);
            
            // 加载自定义字体
            loadCustomFont();
            
            // 自动加载资源
            loadAllResources();
        }

        // 加载自定义字体
        function loadCustomFont() {
            try {
                // 尝试加载Helvetica Neue Ultra Light字体
                customFont = loadFont('/project-resources/helvetica-neue-ultra-light.ttf', 
                    () => {
                        console.log('字体加载成功');
                    },
                    (error) => {
                        console.log('字体加载失败，使用默认字体:', error);
                        customFont = null;
                    }
                );
            } catch (error) {
                console.log('字体加载出错:', error);
                customFont = null;
            }
        }

        // 加载所有资源
        async function loadAllResources() {
            console.log('开始加载资源...');
            
            try {
                // 并行加载PNG序列和背景视频
                const [pngLoaded, videoLoaded] = await Promise.all([
                    loadPNGSequence(),
                    loadBackgroundVideo()
                ]);
                
                if (pngLoaded && videoLoaded) {
                    console.log('所有资源加载完成！开始播放动画');
                    // 不直接设置100%，让Loading进度平滑增长
                    // isLoading = false;
                    // loadingProgress = 100;
                } else {
                    console.log('部分资源加载失败');
                    // isLoading = false;
                    // loadingProgress = 50;
                }
            } catch (error) {
                console.log('资源加载出错:', error);
                // isLoading = false;
                // loadingProgress = 25;
            }
        }

        function draw() {
            const currentTime = millis();
            
            // 控制帧率
            if (currentTime - lastFrameTime < frameInterval) {
                return;
            }
            lastFrameTime = currentTime;
            
            // 设置画布背景 - 根据Loading进度丝滑过渡
            let bgR, bgG, bgB;
            
            if (loadingProgress < 99) {
                // 0%-99%阶段：保持浅蓝紫色
                bgR = currentBackgroundColor.r;
                bgG = currentBackgroundColor.g;
                bgB = currentBackgroundColor.b;
            } else {
                // 99%-100%阶段：丝滑过渡到蓝色
                finalTransitionProgress = (loadingProgress - 99) / 1; // 0到1的过渡
                bgR = lerp(currentBackgroundColor.r, targetBackgroundColor.r, finalTransitionProgress);
                bgG = lerp(currentBackgroundColor.g, targetBackgroundColor.g, finalTransitionProgress);
                bgB = lerp(currentBackgroundColor.b, targetBackgroundColor.b, finalTransitionProgress);
            }
            
            background(bgR, bgG, bgB);
            
            // 实时渲染主画面
            if (originalFrames && originalFrames.length > 0 && backgroundVideo) {
                try {
                    const frameIndex = currentFrame % originalFrames.length;
                    currentFrameImg = originalFrames[frameIndex];
                    
                    if (currentFrameImg) {
                        // 绘制背景视频
                        const videoDrawParams = calculateVideoDrawParams();
                        if (videoDrawParams && backgroundVideo && backgroundVideo.elt) {
                            try {
                                // 检查视频是否真的在播放
                                if (backgroundVideo.elt.readyState >= 2) {
                                    // 不绘制视频作为背景，只用于颜色采样
                                    console.log('背景视频可用于颜色采样');
                                } else {
                                    console.log('视频未准备好播放，状态:', backgroundVideo.elt.readyState);
                                }
                            } catch (error) {
                                console.log('检查视频时出错:', error);
                            }
                        } else {
                            console.log('无法访问背景视频:', {
                                hasVideoDrawParams: !!videoDrawParams,
                                hasBackgroundVideo: !!backgroundVideo,
                                hasVideoElt: !!(backgroundVideo && backgroundVideo.elt),
                                videoDrawParams: videoDrawParams
                            });
                        }
                        
                        // 使用Loading进度控制的像素大小进行像素化处理
                        // 优化：只在需要时加载像素数据
                        if (!framePixels || currentFrame !== lastProcessedFrame) {
                            currentFrameImg.loadPixels();
                            framePixels = currentFrameImg.pixels;
                            lastProcessedFrame = currentFrame;
                        }
                        
                        // 使用Loading进度控制像素大小：Loading越大，像素越小
                        const stepSize = round(constrain(map(loadingProgress, 0, 100, 32, 2), 2, 32));
                        noStroke();
                        
                        for (let y = 0; y < canvasHeight; y += stepSize) {
                            for (let x = 0; x < canvasWidth; x += stepSize) {
                                // 计算在原始帧中的对应位置
                                const srcX = round((x / canvasWidth) * currentFrameImg.width);
                                const srcY = round((y / canvasHeight) * currentFrameImg.height);
                                
                                // 边界检查
                                if (srcX >= 0 && srcX < currentFrameImg.width && 
                                    srcY >= 0 && srcY < currentFrameImg.height) {
                                    
                                    const i = srcY * currentFrameImg.width + srcX;
                                    if (i * 4 + 2 < framePixels.length) {
                                        const r = framePixels[i * 4];
                                        const g = framePixels[i * 4 + 1];
                                        const b = framePixels[i * 4 + 2];
                                        
                                        // 计算亮度
                                        const brightness = (r + g + b) / 3;
                                        
                                        // 根据亮度绘制方块
                                        if (brightness > 50) { // 不是黑色背景
                                            // 统一方块大小，由Loading进度控制
                                            const rectSize = stepSize * 0.99; // 固定大小
                                            
                                            // 从背景视频采样颜色（如果视频可用）
                                            let rectColor = {r, g, b};
                                            if (backgroundVideo && backgroundVideo.elt && backgroundVideo.elt.readyState >= 2) {
                                                try {
                                                    // 计算在视频中的对应位置
                                                    const videoX = round((x / canvasWidth) * backgroundVideo.videoWidth);
                                                    const videoY = round((y / canvasHeight) * backgroundVideo.videoHeight);
                                                    
                                                    if (videoX >= 0 && videoX < backgroundVideo.videoWidth && 
                                                        videoY >= 0 && videoY < backgroundVideo.videoHeight) {
                                                        
                                                        // 创建临时canvas来采样视频颜色
                                                        const tempCanvas = document.createElement('canvas');
                                                        const tempCtx = tempCanvas.getContext('2d');
                                                        tempCanvas.width = 1;
                                                        tempCanvas.height = 1;
                                                        
                                                        tempCtx.drawImage(backgroundVideo.elt, videoX, videoY, 1, 1, 0, 0, 1, 1);
                                                        const videoPixel = tempCtx.getImageData(0, 0, 1, 1).data;
                                                        
                                                        rectColor = {
                                                            r: videoPixel[0],
                                                            g: videoPixel[1],
                                                            b: videoPixel[2]
                                                        };
                                                    }
                                                } catch (error) {
                                                    // 如果视频采样失败，使用PNG帧的颜色
                                                    console.log('视频颜色采样失败，使用PNG帧颜色');
                                                }
                                            }
                                            
                                            // 使用采样到的颜色绘制方块
                                            // 使用发光效果
                                            drawingContext.shadowColor = \`rgb(\${rectColor.r}, \${rectColor.g}, \${rectColor.b})\`;
                                            drawingContext.shadowBlur = 10;
                                            
                                            fill(rectColor.r, rectColor.g, rectColor.b, 200);
                                            noStroke();
                                            rect(x + stepSize/2 - rectSize/2, y + stepSize/2 - rectSize/2, rectSize, rectSize);
                                            
                                            // 重置发光效果
                                            drawingContext.shadowBlur = 0;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log('渲染错误:', error);
                    fill(255, 255, 255);
                    textAlign(CENTER, CENTER);
                    textSize(32);
                    text('处理中...', canvasWidth/2, canvasHeight/2);
                }
            } else {
                fill(100);
                textAlign(CENTER, CENTER);
                textSize(48);
                if (!originalFrames || originalFrames.length === 0) {
                    text('加载PNG序列中...', canvasWidth/2, canvasHeight/2);
                } else if (!backgroundVideo) {
                    text('加载背景视频中...', canvasWidth/2, canvasHeight/2);
                }
            }

            // 控制动画播放速度
            if (isPlaying && originalFrames && originalFrames.length > 0) {
                currentFrame++;
            }

            // 绘制UI文字元素
            drawUI();
        }

        // 绘制UI文字元素
        function drawUI() {
            // 设置字体
            if (customFont) {
                textFont(customFont);
            }
            
            // 根据Loading进度计算文字颜色
            let textColor;
            if (loadingProgress < 99) {
                // 0%-99%阶段：黑色文字
                textColor = 50;
            } else {
                // 99%-100%阶段：丝滑过渡到白色
                finalTransitionProgress = (loadingProgress - 99) / 1;
                textColor = lerp(50, 255, finalTransitionProgress);
            }
            
            // 左上角 ECHUU 品牌信息
            fill(textColor); // 动态文字颜色
            textAlign(LEFT, TOP);
            
            // ECHUU 标题
            textSize(18);
            text('ECHUU', 50, 40);
            
            // 副标题
            textSize(18);
            text('TO RECREATE LIFE', 50, 100);
            text('OUT OF LIVE', 50, 125);
            
            // 右上角 AI VTUBER PLATFORM
            textAlign(RIGHT, TOP);
            textSize(18);
            text('AI VTUBER PLATFORM', canvasWidth - 40, 40);
            
            // 角色旁边的Loading信息
            if (isLoading) {
                // 计算角色位置（假设在画布中央偏左）
                const characterX = canvasWidth * 0.6;
                const characterY = canvasHeight * 0.5;
                
                textAlign(LEFT, CENTER);
                textSize(64);
                text(\`\${Math.round(loadingProgress)}%\`, characterX + 55, characterY);
                
                textSize(24);
                text('Loading...', characterX + 60, characterY + 50);
                
                // 更新加载进度
                if (originalFrames && originalFrames.length > 0) {
                    // 平滑加载到100%
                    if (loadingProgress < 99) {
                        loadingProgress = Math.min(loadingProgress + 0.5, 99);
                    } else if (loadingProgress >= 99) {
                        // 当达到99%时，检查资源是否已加载完成
                        if (originalFrames.length > 0 && backgroundVideo) {
                            // 资源已加载完成，平滑过渡到100%
                            loadingProgress = Math.min(loadingProgress + 0.2, 100);
                            if (loadingProgress >= 100) {
                                isLoading = false; // 完成Loading
                                // 调用完成回调
                                if (window.onLoadingComplete) {
                                    window.onLoadingComplete();
                                }
                            }
                        }
                    }
                }
            } else {
                // 加载完成
                const characterX = canvasWidth * 0.6;
                const characterY = canvasHeight * 0.5;
                
                textAlign(LEFT, CENTER);
                textSize(64);
                text('100%', characterX + 50, characterY);
                
                textSize(24);
                text('Ready!', characterX + 60, characterY + 50);
            }
            
            // 底部中央 eChuu logo
            textAlign(CENTER, BOTTOM);
            textSize(24);
            text('eChuu', canvasWidth / 2, canvasHeight - 30);
            
            // 重置字体
            textFont('Arial');
        }
      })();
      `;

      const existingInline = document.getElementById('p5-loading-inline');
      if (existingInline) existingInline.remove();

      const scriptElement = document.createElement('script');
      scriptElement.id = 'p5-loading-inline';
      scriptElement.textContent = p5Script;
      document.head.appendChild(scriptElement);

      // 设置完成回调
      window.onLoadingComplete = () => {
        if (onComplete) {
          onComplete();
        }
      };
    };

    loadP5();

    return () => {
      // 清理
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      const inline = document.getElementById('p5-loading-inline');
      if (inline) inline.remove();
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 bg-black z-50"
      style={{ fontFamily: 'Arial, sans-serif' }}
    />
  );
}
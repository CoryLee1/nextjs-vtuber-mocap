'use client';

import { useEffect, useRef } from 'react';

interface LoadingPageProps {
  onComplete?: () => void;
  message?: string;
  duration?: number;
}

export default function LoadingPage({ onComplete, message = "Initializing...", duration = 3000 }: LoadingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5LoadedRef = useRef(false);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    // 防止重复执行
    if (p5LoadedRef.current) {
      console.log('p5.js已经加载过，跳过重复加载');
      return;
    }

    // 简化的p5.js测试版本
    const loadP5 = () => {
      console.log('开始加载p5.js...');
      
      // 检查是否已经加载过p5.js
      if (window.p5 && window.p5.prototype) {
        console.log('p5.js已存在，直接初始化');
        p5LoadedRef.current = true;
        initP5App();
        return;
      }

      // 检查是否正在加载中
      if (document.querySelector('script[src*="p5.js"]')) {
        console.log('p5.js正在加载中，等待完成...');
        const checkP5Loaded = setInterval(() => {
          if (window.p5 && window.p5.prototype) {
            clearInterval(checkP5Loaded);
            console.log('p5.js加载完成');
            p5LoadedRef.current = true;
            initP5App();
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/p5@1.11.8/lib/p5.js';
      script.onload = () => {
        console.log('p5.js加载完成');
        p5LoadedRef.current = true;
        initP5App();
      };
      script.onerror = (error) => {
        console.error('p5.js加载失败:', error);
        // 如果p5.js加载失败，显示备用内容
        showFallbackContent();
      };
      document.head.appendChild(script);
    };

    const initP5App = () => {
      if (!containerRef.current || scriptInjectedRef.current) return;
      
      console.log('初始化p5.js应用...');
      scriptInjectedRef.current = true;
      
      // 清除容器
      containerRef.current.innerHTML = '';
      
      // 创建canvas容器
      const canvasDiv = document.createElement('div');
      canvasDiv.id = 'p5-canvas';
      canvasDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1;
        background: #f0f0fc;
      `;
      
      containerRef.current.appendChild(canvasDiv);
      
      // 注入完整的原始p5.js脚本
      const p5Script = `
        console.log('p5.js脚本开始执行...');
        
        // 全局变量
        var originalFrames = [];
        var backgroundVideo;
        var currentFrame = 0;
        var isPlaying = true; // 默认自动播放
        var canvasWidth, canvasHeight;
        var videoFitMode = 'contain'; // 默认完整显示
        var targetFrameRate = 30; // 重命名避免与p5.js全局函数冲突
        var lastFrameTime = 0;
        var frameInterval = 1000 / targetFrameRate;
        var mousePixelSize = 8; // 鼠标控制的像素大小（现在改为Loading控制）
        var currentFrameImg = null; // 当前帧图像
        var framePixels = null; // 当前帧像素数据
        var lastProcessedFrame = -1; // 记录上次处理的帧，避免重复加载像素数据
        var customFont; // 自定义字体
        var loadingProgress = 0; // 加载进度
        var isLoading = true; // 是否正在加载
        var targetBackgroundColor = {r: 0, g: 0, b: 255}; // 目标蓝色
        var currentBackgroundColor = {r: 240, g: 240, b: 252}; // 当前浅蓝紫色
        var finalTransitionProgress = 0; // 99%-100%阶段的过渡进度

        function updateCanvasSize() {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            resizeCanvas(canvasWidth, canvasHeight);
            console.log('Canvas尺寸更新:', canvasWidth, 'x', canvasHeight);
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
            console.log('开始加载PNG序列...');
            originalFrames = [];
            var loadedCount = 0;
            
            try {
                // 从opening1_2000.png到opening1_2133.png
                for (var i = 2000; i <= 2133; i++) {
                    try {
                        // 使用正确的路径
                        var img = await loadImageAsync('/project-resources/opening1_' + i + '.png');
                        originalFrames.push(img);
                        loadedCount++;
                        
                        // 每加载10个文件显示一次进度
                        if (loadedCount % 10 === 0) {
                            console.log('已加载 ' + loadedCount + '/134 帧');
                        }
                    } catch (error) {
                        console.log('加载图片失败: opening1_' + i + '.png', error);
                    }
                }
                
                console.log('成功加载 ' + loadedCount + ' 帧PNG序列');
                return loadedCount > 0;
            } catch (error) {
                console.log('加载PNG序列时出错:', error);
                return false;
            }
        }

        // 异步加载图片的辅助函数
        function loadImageAsync(src) {
            return new Promise(function(resolve, reject) {
                loadImage(src, function(img) {
                    if (img) {
                        resolve(img);
                    } else {
                        reject(new Error('Failed to load image: ' + src));
                    }
                });
            });
        }

        // 自动加载背景视频
        async function loadBackgroundVideo() {
            try {
                console.log('开始加载背景视频...');
                
                // 尝试多个可能的视频文件路径
                var videoPaths = [
                    '/project-resources/6130625_Skyscrapers Japan Shibuya City_By_21_Aerials_Artlist_HD.mp4'
                ];
                
                for (var i = 0; i < videoPaths.length; i++) {
                    try {
                        console.log('尝试加载视频: ' + videoPaths[i]);
                        
                        // 创建视频元素
                        backgroundVideo = createVideo(videoPaths[i]);
                        
                        // 等待视频加载
                        await new Promise(function(resolve, reject) {
                            var timeout = setTimeout(function() {
                                reject(new Error('视频加载超时'));
                            }, 15000); // 15秒超时
                            
                            backgroundVideo.elt.addEventListener('loadeddata', function() {
                                clearTimeout(timeout);
                                console.log('视频数据已加载，尺寸:', backgroundVideo.videoWidth, 'x', backgroundVideo.videoHeight);
                                resolve();
                            });
                            
                            backgroundVideo.elt.addEventListener('canplay', function() {
                                console.log('视频可以播放');
                            });
                            
                            backgroundVideo.elt.addEventListener('error', function(e) {
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
                        
                        console.log('成功加载视频: ' + videoPaths[i]);
                        return true;
                        
                    } catch (error) {
                        console.log('视频 ' + videoPaths[i] + ' 加载失败:', error);
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
            console.log('p5.js setup函数开始执行...');
            
            // 初始化全屏canvas尺寸
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            
            var canvas = createCanvas(canvasWidth, canvasHeight);
            console.log('Canvas创建完成，尺寸:', canvas.width, 'x', canvas.height);
            
            // 确保canvas被放置到正确的容器中
            canvas.parent('p5-canvas');
            console.log('Canvas父元素设置完成');

            // 监听窗口大小变化
            window.addEventListener('resize', updateCanvasSize);
            
            // 加载自定义字体
            loadCustomFont();
            
            // 自动加载资源
            loadAllResources();
            
            console.log('p5.js setup函数执行完成');
        }

        // 加载自定义字体
        function loadCustomFont() {
            try {
                // 尝试加载Helvetica Neue Ultra Light字体
                customFont = loadFont('/project-resources/helvetica-neue-ultra-light.ttf', 
                    function() {
                        console.log('字体加载成功');
                    },
                    function(error) {
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
                var results = await Promise.all([
                    loadPNGSequence(),
                    loadBackgroundVideo()
                ]);
                var pngLoaded = results[0];
                var videoLoaded = results[1];
                
                if (pngLoaded && videoLoaded) {
                    console.log('所有资源加载完成！开始播放动画');
                } else {
                    console.log('部分资源加载失败');
                }
            } catch (error) {
                console.log('资源加载出错:', error);
            }
        }

        function draw() {
            var currentTime = millis();
            
            // 控制帧率
            if (currentTime - lastFrameTime < frameInterval) {
                return;
            }
            lastFrameTime = currentTime;
            
            // 设置画布背景 - 根据Loading进度丝滑过渡
            var bgR, bgG, bgB;
            
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
                    var frameIndex = currentFrame % originalFrames.length;
                    currentFrameImg = originalFrames[frameIndex];
                    
                    if (currentFrameImg) {
                        // 绘制背景视频
                        var videoDrawParams = calculateVideoDrawParams();
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
                        var stepSize = round(constrain(map(loadingProgress, 0, 100, 32, 2), 2, 32));
                        noStroke();
                        
                        for (var y = 0; y < canvasHeight; y += stepSize) {
                            for (var x = 0; x < canvasWidth; x += stepSize) {
                                // 计算在原始帧中的对应位置
                                var srcX = round((x / canvasWidth) * currentFrameImg.width);
                                var srcY = round((y / canvasHeight) * currentFrameImg.height);
                                
                                // 边界检查
                                if (srcX >= 0 && srcX < currentFrameImg.width && 
                                    srcY >= 0 && srcY < currentFrameImg.height) {
                                    
                                    var i = srcY * currentFrameImg.width + srcX;
                                    if (i * 4 + 2 < framePixels.length) {
                                        var r = framePixels[i * 4];
                                        var g = framePixels[i * 4 + 1];
                                        var b = framePixels[i * 4 + 2];
                                        
                                        // 计算亮度
                                        var brightness = (r + g + b) / 3;
                                        
                                        // 根据亮度绘制方块
                                        if (brightness > 50) { // 不是黑色背景
                                            // 统一方块大小，由Loading进度控制
                                            var rectSize = stepSize * 0.99; // 固定大小
                                            
                                            // 从背景视频采样颜色（如果视频可用）
                                            var rectColor = {r: r, g: g, b: b};
                                            if (backgroundVideo && backgroundVideo.elt && backgroundVideo.elt.readyState >= 2) {
                                                try {
                                                    // 计算在视频中的对应位置
                                                    var videoX = round((x / canvasWidth) * backgroundVideo.videoWidth);
                                                    var videoY = round((y / canvasHeight) * backgroundVideo.videoHeight);
                                                    
                                                    if (videoX >= 0 && videoX < backgroundVideo.videoWidth && 
                                                        videoY >= 0 && videoY < backgroundVideo.videoHeight) {
                                                        
                                                        // 创建临时canvas来采样视频颜色
                                                        var tempCanvas = document.createElement('canvas');
                                                        var tempCtx = tempCanvas.getContext('2d');
                                                        tempCanvas.width = 1;
                                                        tempCanvas.height = 1;
                                                        
                                                        tempCtx.drawImage(backgroundVideo.elt, videoX, videoY, 1, 1, 0, 0, 1, 1);
                                                        var videoPixel = tempCtx.getImageData(0, 0, 1, 1).data;
                                                        
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
                                            drawingContext.shadowColor = 'rgb(' + rectColor.r + ', ' + rectColor.g + ', ' + rectColor.b + ')';
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
            var textColor;
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
                var characterX = canvasWidth * 0.6;
                var characterY = canvasHeight * 0.5;
                
                textAlign(LEFT, CENTER);
                textSize(64);
                text(Math.round(loadingProgress) + '%', characterX + 55, characterY);
                
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
                var characterX = canvasWidth * 0.6;
                var characterY = canvasHeight * 0.5;
                
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
        
        console.log('p5.js脚本加载完成');
      `;
      
      const scriptElement = document.createElement('script');
      scriptElement.id = 'p5-test-script';
      scriptElement.textContent = p5Script;
      document.head.appendChild(scriptElement);
      
      console.log('p5.js脚本已注入');
      
      // 设置完成回调
      window.onLoadingComplete = () => {
        console.log('Loading完成回调被调用');
        if (onComplete) {
          onComplete();
        }
      };
    };

    const showFallbackContent = () => {
      if (!containerRef.current) return;
      
      console.log('显示备用内容');
      containerRef.current.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: white;
          font-family: Arial, sans-serif;
          z-index: 50;
        ">
          <h1 style="font-size: 3rem; margin-bottom: 2rem;">ECHUU</h1>
          <p style="font-size: 1.5rem; margin-bottom: 1rem;">TO RECREATE LIFE</p>
          <p style="font-size: 1.5rem; margin-bottom: 2rem;">OUT OF LIVE</p>
          <div style="font-size: 2rem; margin-bottom: 1rem;">Loading...</div>
          <button 
            onclick="window.onLoadingComplete && window.onLoadingComplete()"
            style="
              padding: 1rem 2rem;
              font-size: 1.2rem;
              background: rgba(255,255,255,0.2);
              border: 2px solid white;
              color: white;
              border-radius: 8px;
              cursor: pointer;
            "
          >
            完成加载
          </button>
        </div>
      `;
    };

    loadP5();

    return () => {
      // 清理函数
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      const script = document.getElementById('p5-test-script');
      if (script) script.remove();
      
      // 重置状态
      p5LoadedRef.current = false;
      scriptInjectedRef.current = false;
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 bg-black z-50"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* 临时调试显示 */}
      <div className="absolute top-4 left-4 text-white text-sm z-10">
        LoadingPage 组件已加载
      </div>
    </div>
  );
}




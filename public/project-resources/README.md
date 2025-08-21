# 像素化视频遮罩项目资源

## 项目描述
这是一个使用p5.js创建的像素化视频遮罩效果项目，可以将PNG序列与背景视频结合，创建独特的视觉效果。

## 文件结构
```
project-resources/
├── pixelated-video-mask.html    # 主HTML文件
├── helvetica-neue-ultra-light.ttf    # 自定义字体文件
├── 6130625_Skyscrapers Japan Shibuya City_By_21_Aerials_Artlist_HD.mp4    # 背景视频
└── opening1_2000.png 到 opening1_2133.png    # PNG序列帧 (134张图片)
```

## 资源文件说明

### 1. HTML文件
- **pixelated-video-mask.html**: 主项目文件，包含所有JavaScript代码和HTML结构

### 2. 字体文件
- **helvetica-neue-ultra-light.ttf**: 项目使用的自定义字体，用于显示"ECHUU"等品牌信息

### 3. 背景视频
- **6130625_Skyscrapers Japan Shibuya City_By_21_Aerials_Artlist_HD.mp4**: 日本涩谷城市天际线背景视频，用于颜色采样和背景效果

### 4. PNG序列
- **opening1_2000.png** 到 **opening1_2133.png**: 共134张PNG图片，构成动画序列
- 这些图片会被像素化处理，与背景视频的颜色信息结合

## 技术特性
- 使用p5.js进行图形渲染
- 像素化效果，像素大小由Loading进度控制
- 背景视频颜色采样
- 发光效果和动态UI
- 响应式设计，支持全屏显示

## 使用方法
1. 将所有文件放在同一目录下
2. 在浏览器中打开 `pixelated-video-mask.html`
3. 等待资源加载完成（Loading进度会显示在屏幕上）
4. 动画会自动播放，展示像素化效果

## 注意事项
- 确保所有资源文件都在正确的位置
- 背景视频文件较大（约38MB），加载可能需要一些时间
- PNG序列文件较多，建议使用现代浏览器以获得最佳性能
- 项目需要网络连接来加载p5.js库

## 兼容性
- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 支持HTML5 Canvas和WebGL
- 建议使用桌面设备以获得最佳体验 
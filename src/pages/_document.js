import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="zh">
      <Head>
        <meta name="description" content="VTuber Motion Capture with Next.js and Three.js" />
        <meta name="keywords" content="vtuber, motion capture, nextjs, threejs, mediapipe" />
        <meta name="author" content="VTuber Team" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* 针对 PWA 的 meta 标签 */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VTuber Mocap" />
        
        {/* 预加载关键资源 */}
        <link 
          rel="preconnect" 
          href="https://cdn.jsdelivr.net" 
          crossOrigin="anonymous" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
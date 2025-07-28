/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 自定义颜色 - 蓝白色系
      colors: {
        'vtuber': {
          primary: '#3b82f6',      // 明亮蓝色
          secondary: '#60a5fa',    // 浅蓝色
          accent: '#06b6d4',       // 青色
          light: '#f8fafc',        // 几乎白色
          white: '#ffffff',        // 纯白色
          dark: '#0f172a',         // 深蓝黑色
          darker: '#020617',       // 更深蓝黑色
          text: '#1e40af',         // 文本颜色
          'text-light': '#64748b', // 浅色文本
          blue: {
            50: '#eff6ff',
            100: '#dbeafe', 
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
        },
      },
      
      // 自定义动画
      animation: {
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'fade-in-down': 'fadeInDown 1s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      
      // 关键帧动画
      keyframes: {
        fadeInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInDown: {
          from: {
            opacity: '0',
            transform: 'translateY(-30px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
      },
    },
  },
  plugins: [
    // 自定义插件
    function({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-200': {
          'animation-delay': '200ms',
        },
        '.animation-delay-500': {
          'animation-delay': '500ms',
        },
        '.animation-delay-1000': {
          'animation-delay': '1000ms',
        },
        '.animation-delay-1500': {
          'animation-delay': '1500ms',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
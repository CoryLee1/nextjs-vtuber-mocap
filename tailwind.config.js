/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			vtuber: {
  				primary: '#3b82f6',
  				secondary: '#60a5fa',
  				accent: '#06b6d4',
  				light: '#f8fafc',
  				white: '#ffffff',
  				dark: '#0f172a',
  				darker: '#020617',
  				text: '#1e40af',
  				'text-light': '#64748b',
  				blue: {
  					'50': '#eff6ff',
  					'100': '#dbeafe',
  					'200': '#bfdbfe',
  					'300': '#93c5fd',
  					'400': '#60a5fa',
  					'500': '#3b82f6',
  					'600': '#2563eb',
  					'700': '#1d4ed8',
  					'800': '#1e40af',
  					'900': '#1e3a8a'
  				}
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
  			'fade-in-up': 'fadeInUp 1s ease-out forwards',
  			'fade-in-down': 'fadeInDown 1s ease-out forwards',
  			float: 'float 3s ease-in-out infinite'
  		},
  		keyframes: {
  			fadeInUp: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(30px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			fadeInDown: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(-30px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
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
      require("tailwindcss-animate")
],
};
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			// New palette colors
  			ivory: {
  				DEFAULT: '#F7F7F2',
  				'50': '#FFFFFF',
  				'100': '#F7F7F2',
  				'200': '#EDEDDE',
  			},
  			charcoal: {
  				DEFAULT: '#515052',
  				light: '#6B6A6C',
  				dark: '#3A393B',
  			},
  			'slate-blue': {
  				DEFAULT: '#6C91C2',
  				'50': '#EEF3F9',
  				'100': '#D4E1F0',
  				'200': '#B0C9E3',
  				'300': '#8CAFD5',
  				'400': '#6C91C2',
  				'500': '#4A73A8',
  				'600': '#3A5B85',
  				'700': '#2B4363',
  				'800': '#1D2D42',
  				'900': '#0E1621',
  			},
  			forest: {
  				DEFAULT: '#516A4E',
  				'50': '#EEF2ED',
  				'100': '#D4DDD2',
  				'200': '#A9BBA5',
  				'300': '#7E9978',
  				'400': '#5F7D5A',
  				'500': '#516A4E',
  				'600': '#41553E',
  				'700': '#31402F',
  				'800': '#212B1F',
  				'900': '#101510',
  			},
  			carbon: {
  				'50': '#f7f7f7',
  				'100': '#e3e3e3',
  				'200': '#c8c8c8',
  				'300': '#a4a4a4',
  				'400': '#818181',
  				'500': '#666666',
  				'600': '#515151',
  				'700': '#434343',
  				'800': '#383838',
  				'900': '#262626',
  				'950': '#171717',
  				DEFAULT: '#262626'
  			},
  			sage: {
  				'50': '#f6f8f5',
  				'100': '#e9efe7',
  				'200': '#d4dfcf',
  				'300': '#ACBFA4',
  				'400': '#8fa886',
  				'500': '#6e8d65',
  				'600': '#577150',
  				'700': '#465b41',
  				'800': '#3a4a37',
  				'900': '#313e2f',
  				'950': '#182018',
  				DEFAULT: '#ACBFA4'
  			},
  			cream: {
  				'50': '#fafbf6',
  				'100': '#f3f5eb',
  				'200': '#E2E8CE',
  				'300': '#cdd7ae',
  				'400': '#b5c28a',
  				'500': '#9aab6a',
  				'600': '#7d8c52',
  				'700': '#616d42',
  				'800': '#4f5838',
  				'900': '#434b31',
  				'950': '#232818',
  				DEFAULT: '#E2E8CE'
  			},
  			coral: {
  				'50': '#fef3f2',
  				'100': '#fee4e2',
  				'200': '#fececa',
  				'300': '#fcaba4',
  				'400': '#f87a70',
  				'500': '#EE6055',
  				'600': '#db3a2e',
  				'700': '#b82d23',
  				'800': '#982921',
  				'900': '#7e2822',
  				'950': '#44110d',
  				DEFAULT: '#EE6055'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-inter)',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			},
  			'fade-in-up': {
  				from: {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				from: {
  					opacity: '0',
  					transform: 'translateX(10px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-in-up': 'fade-in-up 0.4s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config

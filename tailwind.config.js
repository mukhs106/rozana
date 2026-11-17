import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
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
  			ink: {
  				DEFAULT: 'hsl(var(--ink))',
  				soft: 'hsl(var(--ink-soft))',
  				mid: 'hsl(var(--ink-mid))',
  				faint: 'hsl(var(--ink-faint))'
  			},
  			chili: {
  				DEFAULT: 'hsl(var(--chili))',
  				foreground: 'hsl(var(--chili-foreground))'
  			},
  			lagoon: 'hsl(var(--lagoon))',
  			dune: 'hsl(var(--dune))',
  			plum: 'hsl(var(--plum))',
  			clay: 'hsl(var(--clay))',
  			cream: 'hsl(var(--cream))',
  			paper: 'hsl(var(--paper))',
  			field: {
  				ink: 'hsl(var(--field-ink))',
  				paper: 'hsl(var(--field-paper))'
  			},
  			olive: 'hsl(var(--olive))',
  			portobello: 'hsl(var(--portobello))',
  			turmeric: 'hsl(var(--turmeric))',
  			fired: 'hsl(var(--fired))',
  			oxblood: 'hsl(var(--oxblood))',
  			tile: {
  				clay: 'hsl(var(--tile-clay))',
  				dune: 'hsl(var(--tile-dune))',
  				portobello: 'hsl(var(--tile-portobello))',
  				lagoon: 'hsl(var(--tile-lagoon))',
  				thyme: 'hsl(var(--tile-thyme))',
  				wine: 'hsl(var(--tile-wine))'
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
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			serif: ['var(--font-serif)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'rise-in': {
  				from: { opacity: '0', transform: 'translateY(10px)' },
  				to: { opacity: '1', transform: 'translateY(0)' }
  			},
  			flash: {
  				'0%': { backgroundColor: 'hsl(var(--chili) / 0.12)' },
  				'100%': { backgroundColor: 'transparent' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'rise-in': 'rise-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
  			flash: 'flash 900ms ease-out 1'
  		}
  	}
  },
  plugins: [animate],
}

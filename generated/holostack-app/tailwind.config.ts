import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        luxuryGold: '#D4AF37',
        midnightBlack: '#2C2C2C'
      }
    }
  },
  plugins: []
};

export default config;
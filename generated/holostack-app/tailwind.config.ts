import type { Config } from 'tailwindcss';

export default <Partial<Config>>{
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
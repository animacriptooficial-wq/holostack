/* ============================================================
   BOLT.DIY STARTER TEMPLATE — scaffold oficial
   Fonte: xKevIsDev/bolt-vite-react-ts-template (template "Vite
   React" do STARTER_TEMPLATES oficial do bolt.diy).

   A IA não reinventa o scaffold — estes ficheiros são a base
   fixa e testada. Os ficheiros gerados pelas fatias SOBREPÕEM
   qualquer um destes com o mesmo path.
   ============================================================ */

import type { GeneratedFile } from "./engine"

export const BOLT_STARTER_FILES: GeneratedFile[] = [
  {
    path: "package.json",
    content: `{
  "name": "holostack-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}
`,
  },
  {
    path: "index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HoloStack App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  },
  {
    path: "vite.config.ts",
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
`,
  },
  {
    path: "tailwind.config.js",
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`,
  },
  {
    path: "postcss.config.js",
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
  },
  {
    path: "tsconfig.json",
    content: `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
`,
  },
  {
    path: "tsconfig.app.json",
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`,
  },
  {
    path: "tsconfig.node.json",
    content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
`,
  },
  {
    path: "src/main.tsx",
    content: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  },
  {
    path: "src/index.css",
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  },
  {
    path: "src/vite-env.d.ts",
    content: `/// <reference types="vite/client" />
`,
  },
  {
    path: ".gitignore",
    content: `node_modules
dist
.env
.env.local
*.log
`,
  },
]

/* Junta o scaffold oficial ao output das fatias.
   Os ficheiros gerados têm prioridade (mesmo path = gerado vence). */
export function withStarterFiles(generated: GeneratedFile[]): GeneratedFile[] {
  const norm = (p: string) => p.replace(/\\/g, "/").replace(/^\.?\//, "")
  const generatedPaths = new Set(generated.map((f) => norm(f.path)))
  const base = BOLT_STARTER_FILES.filter((f) => !generatedPaths.has(norm(f.path)))
  return [...base, ...generated]
}

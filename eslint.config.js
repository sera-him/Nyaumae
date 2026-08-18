import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: [
      'src/components/AnimatedStats.tsx',
      'src/components/aurora/AuroraUI.tsx',
      'src/components/ui/badge.tsx',
      'src/components/ui/button-group.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/form.tsx',
      'src/components/ui/navigation-menu.tsx',
      'src/components/ui/toggle.tsx',
      'src/contexts/MusicContext.tsx',
      'src/contexts/OverloadContext.tsx',
      'src/lib/semanticHighlight.tsx',
    ],
    rules: {
      // These shared modules intentionally export components alongside their
      // hooks, context helpers, or styling variants.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/nctb/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
])

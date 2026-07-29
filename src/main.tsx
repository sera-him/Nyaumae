import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import './styles/story-themes.css'
import './styles/miia-themes.css'
import './styles/math-terminal.css'
import './styles/playground-lab.css'
import './styles/characters-textures.css'
import './styles/world-textures.css'
import './styles/accessibility.css'
import './styles/responsive-fixes.css'
import './styles/performance.css'
import './styles/readability.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)

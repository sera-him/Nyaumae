import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import './styles/motion-system.css'
import './styles/accessibility.css'
import './styles/responsive-fixes.css'
import './styles/performance.css'
import './styles/readability.css'
import './styles/interaction-system.css'
import App from './App.tsx'
import AppErrorBoundary from './components/AppErrorBoundary.tsx'
import { installAsyncModuleRecovery } from './lib/asyncModuleRecovery.ts'
import { applyMotionProfile } from './lib/motionPolicy.ts'

installAsyncModuleRecovery();
applyMotionProfile();

// Legacy HashRouter links (/#/stories/...) become clean paths (/stories/...)
// before the router mounts, so bookmarks and old shared links keep working.
function redirectLegacyHashRoute(): void {
  const hash = window.location.hash;
  if (!hash.startsWith('#/')) return;
  const url = new URL(hash.slice(1), window.location.origin);
  window.location.replace(url.pathname + url.search + url.hash);
}

redirectLegacyHashRoute();

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppErrorBoundary>,
)

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Routes, Route, Navigate, useParams, Link, useLocation } from 'react-router';
import { resolveAlias, isKnownWorldSection, isKnownMiiaSection, isKnownMathSection, isKnownCharacterFilter } from '@/lib/routeManifest';
import './pages/routes-polish.css';

const Portal = lazy(() => import('@/pages/Portal'));
const CharactersPage = lazy(() => import('@/pages/CharactersPage'));
const CharacterDetail = lazy(() => import('@/pages/CharacterDetail'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage'));
const StoryReader = lazy(() => import('@/pages/StoryReader'));
const MiiaSpace = lazy(() => import('@/pages/MiiaSpace'));
const Playground = lazy(() => import('@/pages/Playground'));
const MathModelsPage = lazy(() => import('@/pages/MathModelsPage'));
const WorldPage = lazy(() => import('@/pages/WorldPage'));
const ApiDocs = lazy(() => import('@/pages/ApiDocs'));
const ChatSkin = lazy(() => import('@/pages/ChatSkin'));
const SweetDreamChat = lazy(() => import('@/pages/SweetDreamChat'));
const AuroraChat = lazy(() => import('@/pages/AuroraChat'));
const ChatSelect = lazy(() => import('@/pages/ChatSelect'));
const AISettingsPage = lazy(() => import('@/pages/AISettingsPage'));
const ConversationWorkbench = lazy(() => import('@/pages/ConversationWorkbench'));
const CatMouseGame = lazy(() => import('@/pages/CatMouseGame'));

function PageLoader() {
  return (
    <div className="aurora-loader" role="status" aria-label="页面加载中">
      <div className="aurora-loader-inner">
        <div className="aurora-loader-mark" aria-hidden="true">
          <Sparkles size={26} strokeWidth={1.8} />
        </div>
        <p className="aurora-loader-word">NEURAL CONNECTION</p>
        <div className="aurora-loader-track" aria-hidden="true">
          <div className="aurora-loader-bar" />
        </div>
      </div>
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function NotFoundPage({ domain, message }: { domain?: string; message?: string }) {
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;
  return (
    <div className="not-found-page min-h-screen flex items-center justify-center text-nc-text-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="not-found-panel text-center max-w-md"
      >
        <p className="not-found-code text-6xl font-bold text-nc-violet/30 mb-4" aria-label="404">404</p>
        <p className="not-found-subtitle">信号中断，这条神经通路不存在</p>
        <p className="text-lg mb-2">{message || '页面未找到'}</p>
        {domain && <p className="text-sm text-nc-text-muted/60 mb-6">{domain} 领域未找到该页面</p>}
        <div className="flex gap-3 justify-center">
          {canGoBack && (
            <button onClick={() => window.history.back()} className="not-found-home not-found-back px-4 py-2 rounded-xl text-sm">
              返回上一页
            </button>
          )}
          <Link to="/" className="not-found-home px-4 py-2 rounded-xl bg-nc-violet/15 text-nc-violet hover:bg-nc-violet/25 transition-colors text-sm">
            返回首页
          </Link>
        </div>
        <p className="not-found-hint">按 Ctrl+K 打开全站搜索</p>
      </motion.div>
    </div>
  );
}

function WorldGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownWorldSection(section)) {
    return <NotFoundPage domain="世界" message={`世界领域未找到 "${section}"`} />;
  }
  return <SuspenseWrapper><WorldPage /></SuspenseWrapper>;
}

function MiiaGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownMiiaSection(section)) {
    return <NotFoundPage domain="咪呀空间" message={`咪呀空间未找到 "${section}"`} />;
  }
  return <SuspenseWrapper><MiiaSpace /></SuspenseWrapper>;
}

function MathGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownMathSection(section)) {
    return <NotFoundPage domain="数学模型" message={`数学模型未找到 "${section}"`} />;
  }
  return <SuspenseWrapper><MathModelsPage /></SuspenseWrapper>;
}

function CharacterGuard() {
  const { id } = useParams<{ id: string }>();
  if (id && isKnownCharacterFilter(id)) return <SuspenseWrapper><CharactersPage /></SuspenseWrapper>;
  return <SuspenseWrapper><CharacterDetail /></SuspenseWrapper>;
}

function StoriesGuard() {
  const { storyId, chapterId, partId } = useParams<{ storyId?: string; chapterId?: string; partId?: string }>();

  if (storyId && !chapterId && !partId) {
    return <Navigate to={`/stories/${storyId}/chapters/1`} replace />;
  }

  if (storyId && partId && !chapterId) {
    return <Navigate to={`/stories/${storyId}/parts/${partId}/chapters/1`} replace />;
  }

  return <SuspenseWrapper><StoryReader /></SuspenseWrapper>;
}

export default function AppRoutes() {
  const location = useLocation();
  const alias = resolveAlias(location.pathname);

  return (
    <SuspenseWrapper>
      {alias && location.pathname !== alias ? (
        <Navigate to={alias} replace />
      ) : <Routes>
        <Route path="/" element={<SuspenseWrapper><Portal /></SuspenseWrapper>} />

        <Route path="/world" element={<Navigate to="/world/overview" replace />} />
        <Route path="/world/:section" element={<WorldGuard />} />

        <Route path="/characters" element={<Navigate to="/characters/all" replace />} />
        <Route path="/characters/:id" element={<CharacterGuard />} />

        <Route path="/stories" element={<SuspenseWrapper><StoriesPage /></SuspenseWrapper>} />
        <Route path="/stories/:storyId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/parts/:partId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/chapters/:chapterId" element={<SuspenseWrapper><StoryReader /></SuspenseWrapper>} />
        <Route path="/stories/:storyId/parts/:partId/chapters/:chapterId" element={<SuspenseWrapper><StoryReader /></SuspenseWrapper>} />

        <Route path="/miia" element={<Navigate to="/miia/world" replace />} />
        <Route path="/miia/:section" element={<MiiaGuard />} />

        <Route path="/math" element={<Navigate to="/math/fsiii" replace />} />
        <Route path="/math/:section" element={<MathGuard />} />

        <Route path="/playground" element={<Navigate to="/playground/games" replace />} />
        <Route path="/playground/games" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/games/:game" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/cat-mouse" element={<SuspenseWrapper><CatMouseGame /></SuspenseWrapper>} />
        <Route path="/playground/scratch" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/scratch/:game" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />

        <Route path="/api" element={<SuspenseWrapper><ApiDocs /></SuspenseWrapper>} />
        <Route path="/api/:provider" element={<SuspenseWrapper><ApiDocs /></SuspenseWrapper>} />
        <Route path="/settings" element={<Navigate to="/settings/ai" replace />} />
        <Route path="/settings/ai" element={<SuspenseWrapper><AISettingsPage /></SuspenseWrapper>} />
        <Route path="/chat" element={<SuspenseWrapper><ChatSelect /></SuspenseWrapper>} />
        <Route path="/chat/ocean" element={<SuspenseWrapper><ChatSkin /></SuspenseWrapper>} />
        <Route path="/chat/aurora" element={<SuspenseWrapper><AuroraChat /></SuspenseWrapper>} />
        <Route path="/chat/system" element={<SuspenseWrapper><ConversationWorkbench /></SuspenseWrapper>} />
        <Route path="/chat/legacy" element={<Navigate to="/chat" replace />} />
        <Route path="/sweetdream" element={<SuspenseWrapper><SweetDreamChat /></SuspenseWrapper>} />
        <Route path="/neural-clash" element={<Navigate to="/playground/games/neural-clash" replace />} />

        <Route path="*" element={<NotFoundPage message="页面未找到" />} />
      </Routes>}
    </SuspenseWrapper>
  );
}

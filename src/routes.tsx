import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, Link, useLocation } from 'react-router';
import { resolveAlias, isKnownWorldSection, isKnownMiiaSection, isKnownMathSection, isKnownCharacterFilter } from '@/lib/routeManifest';

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
const AISettingsPage = lazy(() => import('@/pages/AISettingsPage'));
const ConversationWorkbench = lazy(() => import('@/pages/ConversationWorkbench'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-nc-violet/30 border-t-nc-violet rounded-full animate-spin" />
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function useCanonicalRedirect(): void {
  const location = useLocation();
  useEffect(() => {
    const alias = resolveAlias(location.pathname);
    if (alias && location.pathname !== alias) {
      window.history.replaceState(null, '', `#${alias}`);
    }
  }, [location.pathname]);
}

function NotFoundPage({ domain, message }: { domain?: string; message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-nc-text-muted px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-nc-violet/30 mb-4">404</p>
        <p className="text-lg mb-2">{message || '页面未找到'}</p>
        {domain && <p className="text-sm text-nc-text-muted/60 mb-6">{domain} 领域未找到该页面</p>}
        <div className="flex gap-3 justify-center">
          <Link to="/" className="px-4 py-2 rounded-xl bg-nc-violet/15 text-nc-violet hover:bg-nc-violet/25 transition-colors text-sm">
            返回首页
          </Link>
        </div>
      </div>
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

  useEffect(() => {
    if (storyId && !chapterId && !partId) {
      window.history.replaceState(null, '', `#/stories/${storyId}/chapters/1`);
    }
  }, [storyId, chapterId, partId]);

  useEffect(() => {
    if (partId && !chapterId) {
      window.history.replaceState(null, '', `#/stories/${storyId}/parts/${partId}/chapters/1`);
    }
  }, [storyId, partId, chapterId]);

  return <SuspenseWrapper><StoryReader /></SuspenseWrapper>;
}

export default function AppRoutes() {
  useCanonicalRedirect();

  return (
    <SuspenseWrapper>
      <Routes>
        <Route path="/" element={<SuspenseWrapper><Portal /></SuspenseWrapper>} />

        <Route path="/world" element={<Navigate to="/world/overview" replace />} />
        <Route path="/world/:section" element={<WorldGuard />} />

        <Route path="/characters" element={<Navigate to="/characters/all" replace />} />
        <Route path="/characters/:id" element={<CharacterGuard />} />

        <Route path="/stories" element={<SuspenseWrapper><StoriesPage /></SuspenseWrapper>} />
        <Route path="/stories/:storyId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/chapters/:chapterId" element={<SuspenseWrapper><StoryReader /></SuspenseWrapper>} />
        <Route path="/stories/:storyId/parts/:partId/chapters/:chapterId" element={<SuspenseWrapper><StoryReader /></SuspenseWrapper>} />

        <Route path="/miia" element={<Navigate to="/miia/world" replace />} />
        <Route path="/miia/:section" element={<MiiaGuard />} />

        <Route path="/math" element={<Navigate to="/math/fsiii" replace />} />
        <Route path="/math/:section" element={<MathGuard />} />

        <Route path="/playground" element={<Navigate to="/playground/games" replace />} />
        <Route path="/playground/games" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/games/:game" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/rules" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/rules/:rule" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/scratch" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />
        <Route path="/playground/scratch/:game" element={<SuspenseWrapper><Playground /></SuspenseWrapper>} />

        <Route path="/api" element={<SuspenseWrapper><ApiDocs /></SuspenseWrapper>} />
        <Route path="/api/:provider" element={<SuspenseWrapper><ApiDocs /></SuspenseWrapper>} />
        <Route path="/settings" element={<Navigate to="/settings/ai" replace />} />
        <Route path="/settings/ai" element={<SuspenseWrapper><AISettingsPage /></SuspenseWrapper>} />
        <Route path="/chat" element={<SuspenseWrapper><ConversationWorkbench /></SuspenseWrapper>} />
        <Route path="/chat/legacy" element={<SuspenseWrapper><ChatSkin /></SuspenseWrapper>} />
        <Route path="/sweetdream" element={<SuspenseWrapper><SweetDreamChat /></SuspenseWrapper>} />

        <Route path="*" element={<NotFoundPage message="页面未找到" />} />
      </Routes>
    </SuspenseWrapper>
  );
}

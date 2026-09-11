import { lazy, Suspense, useDeferredValue, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, Link, useLocation } from 'react-router';
import PageState from '@/components/PageState';
import {
  getPlaygroundItemCategory,
  isKnownCharacterFilter,
  isKnownCharacterId,
  isKnownMathSection,
  isKnownMiiaSection,
  isKnownPlaygroundItem,
  isKnownProviderId,
  isKnownWorldSection,
  resolveAlias,
} from '@/lib/routeManifest';
import { storyGuardData } from '@/lib/generated/routeGuardData.generated';
import { routeLoaders } from '@/lib/routePreload';
import { clearAsyncModuleRecoveryMarker } from '@/lib/asyncModuleRecovery';
import RouteErrorBoundary, { type RouteArea } from '@/components/RouteErrorBoundary';
import './pages/routes-polish.css';

const Portal = lazy(routeLoaders.portal);
const CharactersPage = lazy(routeLoaders.characters);
const CharacterDetail = lazy(routeLoaders.characterDetail);
const StoriesPage = lazy(routeLoaders.stories);
const StoryReader = lazy(routeLoaders.storyReader);
const MiiaSpace = lazy(routeLoaders.miia);
const Playground = lazy(routeLoaders.playground);
const MathModelsPage = lazy(routeLoaders.math);
const WorldPage = lazy(routeLoaders.world);
const ApiDocs = lazy(routeLoaders.api);
const ChatSkin = lazy(routeLoaders.oceanChat);
const SweetDreamChat = lazy(routeLoaders.sweetDreamChat);
const AuroraChat = lazy(routeLoaders.auroraChat);
const ChatSelect = lazy(routeLoaders.chatSelect);
const AISettingsPage = lazy(routeLoaders.aiSettings);
const CodexPage = lazy(routeLoaders.codex);
const NctbPage = lazy(routeLoaders.nctb);
const DataStatsPage = lazy(routeLoaders.analytics);

function PageLoader() {
  return (
    <PageState
      kind="loading"
      title="正在建立神经连接"
      description="时间、角色与规则正在同步，很快就好。"
      fullPage
    />
  );
}

function SuspenseWrapper({ children, area = 'other' }: { children: React.ReactNode; area?: RouteArea }) {
  return (
    <RouteErrorBoundary area={area}>
      <Suspense fallback={<PageLoader />}>
        <RouteModuleReady />
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function RouteModuleReady() {
  useEffect(() => {
    clearAsyncModuleRecoveryMarker();
  }, []);
  return null;
}

function NotFoundPage({ domain, message }: { domain?: string; message?: string }) {
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;
  return (
    <PageState
      kind="empty"
      eyebrow="404 / NOT FOUND"
      title={message || '没有找到这个页面'}
      description={domain ? `${domain}中不存在这条内容路径，可以返回上一层或回到首页。` : '这条内容路径暂时不存在，可以返回上一层或回到首页。'}
      fullPage
      actions={<>
        {canGoBack && (
          <button type="button" onClick={() => window.history.back()} className="aurora-button">
            返回上一页
          </button>
        )}
        <Link to="/" className="aurora-button aurora-button-primary">返回首页</Link>
      </>}
    />
  );
}

function WorldGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownWorldSection(section)) {
    return <NotFoundPage domain="世界" message={`世界领域未找到 "${section}"`} />;
  }
  return <SuspenseWrapper area="world"><WorldPage /></SuspenseWrapper>;
}

function MiiaGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownMiiaSection(section)) {
    return <NotFoundPage domain="咪呀空间" message={`咪呀空间未找到 "${section}"`} />;
  }
  return <SuspenseWrapper area="world"><MiiaSpace /></SuspenseWrapper>;
}

function MathGuard() {
  const { section } = useParams<{ section: string }>();
  if (section && !isKnownMathSection(section)) {
    return <NotFoundPage domain="数学模型" message={`数学模型未找到 "${section}"`} />;
  }
  return <SuspenseWrapper area="other"><MathModelsPage /></SuspenseWrapper>;
}

function CharacterGuard() {
  const { id } = useParams<{ id: string }>();
  if (id && isKnownCharacterFilter(id)) {
    return <Navigate to={id === 'all' ? '/characters' : `/characters?group=${encodeURIComponent(id)}`} replace />;
  }
  if (!id || !isKnownCharacterId(id)) {
    return <NotFoundPage domain="角色档案" message={`角色未找到 "${id ?? ''}"`} />;
  }
  return <SuspenseWrapper area="characters"><CharacterDetail /></SuspenseWrapper>;
}

function isPositiveInteger(value: string | undefined): value is string {
  return Boolean(value && /^[1-9]\d*$/.test(value));
}

function StoriesGuard() {
  const { storyId, chapterId, partId } = useParams<{ storyId?: string; chapterId?: string; partId?: string }>();
  const story = storyGuardData.find((entry) => entry.id === storyId);

  if (!story) {
    return <NotFoundPage domain="故事" message={`故事未找到 "${storyId ?? ''}"`} />;
  }

  if ((chapterId && !isPositiveInteger(chapterId)) || (partId && !isPositiveInteger(partId))) {
    return <NotFoundPage domain="故事" message="章节路径无效" />;
  }

  if (!story.contentSource && (partId || (chapterId && Number(chapterId) > story.chapterTitles.length))) {
    return <NotFoundPage domain="故事" message="未找到该章节" />;
  }

  if (story.contentSource && story.chapterCount && (
    (chapterId && Number(chapterId) > story.chapterCount)
    || (partId && Number(partId) > story.chapterCount)
  )) {
    return <NotFoundPage domain="故事" message="未找到该章节" />;
  }

  if (!chapterId && !partId) {
    return <Navigate to={`/stories/${story.id}/chapters/1`} replace />;
  }

  if (partId && !chapterId) {
    return <Navigate to={`/stories/${story.id}/parts/${partId}/chapters/1`} replace />;
  }

  return <SuspenseWrapper area="stories"><StoryReader /></SuspenseWrapper>;
}

function PlaygroundGuard({ category }: { category: 'games' | 'scratch' }) {
  const { game } = useParams<{ game?: string }>();
  const itemCategory = game ? getPlaygroundItemCategory(game) : null;

  if (!game || !isKnownPlaygroundItem(game) || itemCategory !== category) {
    return <NotFoundPage domain="游戏实验场" message={`未找到该${category === 'scratch' ? ' Scratch 小游戏' : '游戏'}${game ? ` "${game}"` : ''}`} />;
  }

  return <SuspenseWrapper area="games"><Playground /></SuspenseWrapper>;
}

function ApiGuard() {
  const { provider } = useParams<{ provider?: string }>();
  if (!provider || !isKnownProviderId(provider)) {
    return <NotFoundPage domain="API 目录" message={`未找到 API 供应商 "${provider ?? ''}"`} />;
  }
  return <SuspenseWrapper area="settings"><ApiDocs /></SuspenseWrapper>;
}

export default function AppRoutes() {
  const location = useLocation();
  const deferredLocation = useDeferredValue(location);
  const alias = resolveAlias(deferredLocation.pathname);

  return (
    <>
      {alias && deferredLocation.pathname !== alias ? (
        <Navigate
          to={{
            pathname: alias,
            search: deferredLocation.search,
            hash: deferredLocation.hash,
          }}
          replace
        />
      ) : <Routes location={deferredLocation}>
        <Route path="/" element={<SuspenseWrapper area="home"><Portal /></SuspenseWrapper>} />

        <Route path="/world" element={<Navigate to="/world/overview" replace />} />
        <Route path="/world/:section" element={<WorldGuard />} />

        <Route path="/characters" element={<SuspenseWrapper area="characters"><CharactersPage /></SuspenseWrapper>} />
        <Route path="/characters/:id" element={<CharacterGuard />} />

        <Route path="/stories" element={<SuspenseWrapper area="stories"><StoriesPage /></SuspenseWrapper>} />
        <Route path="/stories/:storyId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/parts/:partId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/chapters/:chapterId" element={<StoriesGuard />} />
        <Route path="/stories/:storyId/parts/:partId/chapters/:chapterId" element={<StoriesGuard />} />

        <Route path="/miia" element={<Navigate to="/miia/world" replace />} />
        <Route path="/miia/:section" element={<MiiaGuard />} />

        <Route path="/math" element={<Navigate to="/math/fsiii" replace />} />
        <Route path="/math/:section" element={<MathGuard />} />

        <Route path="/playground" element={<Navigate to="/playground/games" replace />} />
        <Route path="/playground/games" element={<SuspenseWrapper area="games"><Playground /></SuspenseWrapper>} />
        <Route path="/playground/games/:game" element={<PlaygroundGuard category="games" />} />
        <Route path="/cat-mouse" element={<Navigate to="/playground/games/cat-mouse" replace />} />
        <Route path="/playground/scratch" element={<SuspenseWrapper area="games"><Playground /></SuspenseWrapper>} />
        <Route path="/playground/scratch/:game" element={<PlaygroundGuard category="scratch" />} />

        <Route path="/api" element={<SuspenseWrapper area="settings"><ApiDocs /></SuspenseWrapper>} />
        <Route path="/api/:provider" element={<ApiGuard />} />
        <Route path="/settings" element={<Navigate to="/settings/ai" replace />} />
        <Route path="/settings/ai" element={<SuspenseWrapper area="settings"><AISettingsPage /></SuspenseWrapper>} />
        <Route path="/codex" element={<SuspenseWrapper area="other"><CodexPage /></SuspenseWrapper>} />
        <Route path="/nctb" element={<SuspenseWrapper area="settings"><NctbPage /></SuspenseWrapper>} />
        <Route path="/analytics" element={<SuspenseWrapper area="settings"><DataStatsPage /></SuspenseWrapper>} />
        <Route path="/chat" element={<SuspenseWrapper area="chat"><ChatSelect /></SuspenseWrapper>} />
        <Route path="/chat/ocean" element={<SuspenseWrapper area="chat"><ChatSkin /></SuspenseWrapper>} />
        <Route path="/chat/sweetdream" element={<SuspenseWrapper area="chat"><SweetDreamChat /></SuspenseWrapper>} />
        <Route path="/chat/aurora" element={<SuspenseWrapper area="chat"><AuroraChat /></SuspenseWrapper>} />
        <Route path="/chat/legacy" element={<Navigate to="/chat" replace />} />
        <Route path="/neural-clash" element={<Navigate to="/playground/games/neural-clash" replace />} />

        <Route path="*" element={<NotFoundPage message="页面未找到" />} />
      </Routes>}
    </>
  );
}

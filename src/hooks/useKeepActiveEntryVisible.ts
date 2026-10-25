import { useEffect, useRef } from 'react';

/** 目录项贴边时留的余量，避免“正在阅读”那一行紧贴滚动条上下沿。 */
const EDGE_PADDING = 12;

/**
 * 找出最近的一个真正能竖向滚动的祖先。刻意不接受 documentElement / body：
 * 目录只应该在自己的框里动，绝不能连带把整页视口滚走。
 */
function findScrollParent(element: HTMLElement): HTMLElement | null {
  let node = element.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (/(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

function scrollActiveIntoView(root: HTMLElement): void {
  // 用 aria-current 找当前项，而不是按下标算：以后加篇章、加分卷都不用改这里。
  const active = root.querySelector<HTMLElement>('[aria-current="page"]');
  if (!active) return;

  // 同一份目录在窄屏 <details> 和宽屏吸顶栏里各渲染一次；隐藏的那份没有盒子，跳过。
  const activeRect = active.getBoundingClientRect();
  if (activeRect.height === 0) return;

  const scroller = findScrollParent(active);
  if (!scroller) return;
  const scrollerRect = scroller.getBoundingClientRect();
  if (scrollerRect.height === 0) return;

  // 单行比可视区还高时（比如以后出现超长标题），只能贴住上沿。
  const tallerThanViewport = activeRect.height + EDGE_PADDING * 2 > scroller.clientHeight;
  let next = scroller.scrollTop;
  if (tallerThanViewport) {
    next += activeRect.top - scrollerRect.top - EDGE_PADDING;
  } else if (activeRect.top < scrollerRect.top + EDGE_PADDING) {
    next -= scrollerRect.top + EDGE_PADDING - activeRect.top;
  } else if (activeRect.bottom > scrollerRect.bottom - EDGE_PADDING) {
    next += activeRect.bottom - (scrollerRect.bottom - EDGE_PADDING);
  }

  const clamped = Math.max(0, Math.min(next, scroller.scrollHeight - scroller.clientHeight));
  // 已经就位就别动，免得每次翻章都看到一次多余的滚动。
  if (Math.abs(clamped - scroller.scrollTop) < 1) return;
  // 直接赋值而不是 scrollTo({behavior:'smooth'})：这里要的是“打开就已经在那一章”，
  // 平滑动画会先露出最上面一屏，看起来正好像没生效。
  scroller.scrollTop = clamped;
}

/**
 * 让一个长目录的滚动条停在当前选中的那一项上。
 *
 * 路由每换一次章节都会整块重挂载（见 RouteErrorBoundary 的 key），滚动位置会被浏览器
 * 清成 0；这里在挂载和当前项变化时把选中项滚回视野内，所以章节越加越多也不会跑偏。
 *
 * @param activeKey 当前项的身份（篇章 / 序号 / 条目总数），变了就重新对位。
 */
export function useKeepActiveEntryVisible<T extends HTMLElement>(activeKey: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    scrollActiveIntoView(root);

    // 窄屏目录收在 <details> 里：收起时列表高度为 0，展开后要再对一次位置。
    const details = root.closest('details');
    if (!details) return;
    let retryTimer = 0;
    const handleToggle = () => {
      scrollActiveIntoView(root);
      // 目录用 grid 0fr→1fr 折叠动画展开，transition 期间列表还在长高，
      // 动画结束后再补一次对位，保证展开就直接停在当前章节上。
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => scrollActiveIntoView(root), 280);
    };
    details.addEventListener('toggle', handleToggle);
    return () => {
      window.clearTimeout(retryTimer);
      details.removeEventListener('toggle', handleToggle);
    };
  }, [activeKey]);

  return ref;
}

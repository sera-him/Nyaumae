import { useEffect } from 'react';

/**
 * 把实测视口高度写入 `--app-vh-px`，并由 `html[data-app-vh="measured"]`
 * 提升为聊天布局的 `--app-vh`。
 *
 * 这样聊天的两层高度不再只靠 `svh` 撑着：CSS 先给 `100vh` → `100svh`，
 * JS 起来后再换成实际像素值，移动端地址栏收放与软键盘弹出都不会把输入框
 * 顶到视口外面去。
 */
const MIN_USABLE_HEIGHT = 320;
const VISUAL_VIEWPORT_TOLERANCE = 80;

function readViewportHeight(): number {
  const layout = window.innerHeight;
  const visual = window.visualViewport?.height ?? layout;
  // 只有可视视口明显小于布局视口（软键盘、移动端工具栏）时才跟随它，
  // 否则桌面端的页面缩放会算出偏矮的值。
  const height = visual < layout - VISUAL_VIEWPORT_TOLERANCE ? visual : layout;
  return Math.max(MIN_USABLE_HEIGHT, Math.round(height));
}

export function useAppViewportHeight(): void {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const apply = () => {
      frame = 0;
      root.style.setProperty('--app-vh-px', `${readViewportHeight()}px`);
      root.dataset.appVh = 'measured';
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      delete root.dataset.appVh;
      root.style.removeProperty('--app-vh-px');
    };
  }, []);
}

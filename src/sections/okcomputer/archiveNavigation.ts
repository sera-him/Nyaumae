export const ARCHIVE_REVEAL_EVENT = 'self-observation-archive:reveal';

/** 请求档案区清除筛选、显示并定位到指定条目。 */
export function revealObservation(id: number) {
  window.dispatchEvent(
    new CustomEvent<number>(ARCHIVE_REVEAL_EVENT, { detail: id }),
  );
}

export default function Footer() {
  return (
    <footer className="no-print">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-inkstrong">
              自我观察档案
            </p>
            <p className="font-mono2 mt-1 text-[12px] uppercase tracking-widest text-mute">
              Self-Observation Archive · 46 Entries
            </p>
          </div>
          <p className="max-w-md text-[12px] leading-6 text-mute">
            本档案用于自我理解与就诊沟通，不构成医学诊断。本站为静态展示，不设账户或云端存储；搜索与筛选只在当前页面生效，导出文件由浏览器在本地生成。
          </p>
        </div>
      </div>
    </footer>
  );
}

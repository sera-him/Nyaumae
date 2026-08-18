interface ConfirmActionOptions {
  title: string;
  consequence: string;
}

export function confirmAction({ title, consequence }: ConfirmActionOptions): boolean {
  if (typeof window === 'undefined') return false;
  return window.confirm(`${title}\n\n${consequence}\n\n选择“确定”后立即执行。`);
}

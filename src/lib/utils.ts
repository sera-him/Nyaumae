import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const base = typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/';

export function p(path: string): string {
  return `${base}${path.replace(/^\//, '')}`;
}

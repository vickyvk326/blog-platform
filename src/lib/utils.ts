import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to convert buffer { type: "Buffer", data: [...] } to image URL
export type bufferObj = { type: string; data: number[] };

export function bufferToImageUrl(bufferObj: bufferObj) {
  try {
    const uint8Array = new Uint8Array(bufferObj.data);
    const blob = new Blob([uint8Array], { type: 'image/png' }); // screenshots are usually PNG
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export const urlRegex = /^(https?:\/\/)([\w.-]+)(:[0-9]+)?(\/[^\s]*)?$/i;

import clsx from 'clsx';

export function cn(...inputs: Parameters<typeof clsx>): string {
  return clsx(...inputs);
}

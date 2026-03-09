import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function calculateSpeedBonus(timeLeftMs: number, totalTimeMs: number): number {
  const ratio = timeLeftMs / totalTimeMs
  if (ratio > 0.8) return 10
  if (ratio > 0.5) return 7
  if (ratio > 0.25) return 4
  return 0
}

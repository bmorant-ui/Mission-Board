import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO, isPast } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—'
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function isOverdue(date: string | null | undefined): boolean {
  if (!date) return false
  const d = parseISO(date)
  return isValid(d) && isPast(d)
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const d = parseISO(date)
  if (!isValid(d)) return null
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const GRANT_STATUS_COLORS: Record<string, string> = {
  research: 'bg-slate-100 text-slate-700',
  drafting: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  awarded: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-700',
}

export const VOLUNTEER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
}

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4',
]

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('uk-UA').format(value);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const ORDER_TYPES = ['цифрова', 'друк', 'оригінал'];
export const SALES_CHANNELS = ['Instagram', 'Messenger', 'Viber/Telegram'];
export const ORDER_STATUSES = ['нове', 'оплачено', 'виконано', 'скасовано'];
export const FRAME_TYPES = ['1-10', '11-14'];

export const STATUS_COLORS = {
  'нове': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'оплачено': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'виконано': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'скасовано': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

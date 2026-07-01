import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatTimeRemaining(endTime: string | Date): string {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  const diff = differenceInSeconds(end, now);

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getTimeRemainingSeconds(endTime: string | Date): number {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  return Math.max(0, differenceInSeconds(end, now));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isAuctionEnded(endTime: string | Date): boolean {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  return new Date() >= end;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'closed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getTimerColor(endTime: string | Date): string {
  const seconds = getTimeRemainingSeconds(endTime);
  if (seconds <= 0) return 'text-gray-500';
  if (seconds < 300) return 'text-red-500 animate-pulse';
  if (seconds < 3600) return 'text-orange-500';
  if (seconds < 86400) return 'text-yellow-600';
  return 'text-green-600';
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateAvatarUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encoded}&backgroundColor=4f46e5&textColor=ffffff`;
}

export const BIKE_IMAGES = [
  'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/273434/pexels-photo-273434.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/114960/pexels-photo-114960.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1825655/pexels-photo-1825655.jpeg?auto=compress&cs=tinysrgb&w=800',
] as const;

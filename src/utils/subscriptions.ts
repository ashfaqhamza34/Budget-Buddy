import { SubscriptionItem } from '../types';

export const DEFAULT_SUBSCRIPTION_SERVICES = [
  'Netflix',
  'Amazon Prime',
  'Disney+',
  'Spotify',
  'YouTube Premium',
  'CapCut',
  'Adobe Creative Cloud',
  'iCloud/Google One',
  'Apple Music',
  'ChatGPT Plus',
  'Xbox Game Pass/PlayStation Plus',
  'Gym Membership',
];

const CUSTOM_SERVICES_KEY = 'budget_buddy_custom_subscription_services';

export function getStoredCustomSubscriptionServices(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SERVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomSubscriptionServices(services: string[]): void {
  try {
    localStorage.setItem(CUSTOM_SERVICES_KEY, JSON.stringify(services));
  } catch (err) {
    console.error('Failed to save custom subscription services:', err);
  }
}

export function addCustomSubscriptionService(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return getStoredCustomSubscriptionServices();

  const current = getStoredCustomSubscriptionServices();
  const allDefaultLower = DEFAULT_SUBSCRIPTION_SERVICES.map((s) => s.toLowerCase());

  // If already in default list, don't duplicate in custom
  if (allDefaultLower.includes(trimmed.toLowerCase())) {
    return current;
  }

  // If already in custom list, don't duplicate
  if (current.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }

  const updated = [...current, trimmed];
  saveStoredCustomSubscriptionServices(updated);
  return updated;
}

export function formatSubscriptionSummary(subscriptions?: SubscriptionItem[]): string | null {
  if (!subscriptions || subscriptions.length === 0) return null;
  const names = subscriptions.map((s) => s.name.trim()).filter(Boolean);
  if (names.length === 0) return null;
  return `Includes: ${names.join(', ')}`;
}

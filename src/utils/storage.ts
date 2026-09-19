import { Transaction, MonthlyBudget, UserSettings, ChatMessage, CustomCategory, RecurringTemplate } from '../types';

const SETTINGS_KEY = 'budget_buddy_settings';
const TRANSACTIONS_KEY = 'budget_buddy_transactions';
const BUDGET_KEY = 'budget_buddy_budget';
const CHAT_KEY = 'budget_buddy_chat';
const CUSTOM_CATEGORIES_KEY = 'budget_buddy_custom_categories';
const RECURRING_TEMPLATES_KEY = 'budget_buddy_recurring_templates';

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'USD',
  locale: 'en-US',
  hasCompletedOnboarding: false,
};

export const DEFAULT_BUDGET: MonthlyBudget = {
  overallBudget: 2500,
  categoryBudgets: {
    Food: 600,
    Transport: 250,
    Bills: 400,
    Rent: 800,
    Entertainment: 150,
    Shopping: 200,
    Health: 100,
  },
};

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const list: Transaction[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
  }
}

export function getStoredBudget(): MonthlyBudget {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    if (!raw) return DEFAULT_BUDGET;
    return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BUDGET;
  }
}

export function saveStoredBudget(budget: MonthlyBudget): void {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
  } catch (err) {
    console.error('Failed to save budget to localStorage:', err);
  }
}

export function getStoredChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const list: ChatMessage[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredChat(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save chat to localStorage:', err);
  }
}

export function getStoredCustomCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (!raw) return [];
    const list: CustomCategory[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredCustomCategories(categories: CustomCategory[]): void {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save custom categories to localStorage:', err);
  }
}

export function getStoredRecurringTemplates(): RecurringTemplate[] {
  try {
    const raw = localStorage.getItem(RECURRING_TEMPLATES_KEY);
    if (!raw) return [];
    const list: RecurringTemplate[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredRecurringTemplates(templates: RecurringTemplate[]): void {
  try {
    localStorage.setItem(RECURRING_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save recurring templates to localStorage:', err);
  }
}

/**
 * Generates lightweight mock entries for users who want to try the app with pre-filled demo data
 */
export function seedSampleData(): { transactions: Transaction[]; budget: MonthlyBudget } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const d = (day: number) => `${year}-${month}-${String(day).padStart(2, '0')}`;

  const transactions: Transaction[] = [
    {
      id: 'demo-tx-1',
      type: 'income',
      amount: 3200,
      category: 'Salary',
      date: d(1),
      note: 'Monthly base payout',
      createdAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'demo-tx-2',
      type: 'expense',
      amount: 750,
      category: 'Rent',
      date: d(2),
      note: 'Apartment monthly lease',
      createdAt: Date.now() - 14 * 86400000,
    },
    {
      id: 'demo-tx-3',
      type: 'expense',
      amount: 142.5,
      category: 'Food',
      date: d(5),
      note: 'Weekly grocery basket',
      createdAt: Date.now() - 11 * 86400000,
    },
    {
      id: 'demo-tx-4',
      type: 'expense',
      amount: 85,
      category: 'Bills',
      date: d(8),
      note: 'High-speed internet & power',
      createdAt: Date.now() - 8 * 86400000,
    },
    {
      id: 'demo-tx-5',
      type: 'expense',
      amount: 65,
      category: 'Transport',
      date: d(11),
      note: 'Fuel & commuter transit',
      createdAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'demo-tx-6',
      type: 'expense',
      amount: 54,
      category: 'Entertainment',
      date: d(13),
      note: 'Cinema tickets & snacks',
      createdAt: Date.now() - 3 * 86400000,
    },
    {
      id: 'demo-tx-7',
      type: 'expense',
      amount: 98,
      category: 'Shopping',
      date: d(14),
      note: 'New work footwear',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'demo-tx-8',
      type: 'expense',
      amount: 34.97,
      category: 'Subscriptions',
      date: d(6),
      note: 'Monthly digital services',
      createdAt: Date.now() - 10 * 86400000,
      subscriptions: [
        { id: 'sub-sample-1', name: 'Netflix', amount: 15.49 },
        { id: 'sub-sample-2', name: 'Spotify', amount: 11.99 },
        { id: 'sub-sample-3', name: 'CapCut', amount: 7.49 },
      ],
    },
  ];

  return { transactions, budget: DEFAULT_BUDGET };
}

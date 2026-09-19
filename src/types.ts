export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Rent'
  | 'Shopping'
  | 'Entertainment'
  | 'Health'
  | 'Education'
  | 'Subscriptions'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Bills',
  'Rent',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Subscriptions',
  'Other',
];

export const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rental',
  'Gift',
  'Other',
];

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringTemplate {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  isPaused: boolean;
  subscriptions?: SubscriptionItem[];
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string; // ExpenseCategory or Income Source
  date: string; // YYYY-MM-DD
  note?: string;
  subscriptions?: SubscriptionItem[];
  isRecurring?: boolean;
  recurringTemplateId?: string;
  createdAt: number;
}

export interface MonthlyBudget {
  overallBudget: number;
  categoryBudgets: Record<string, number>;
}

export interface CurrencyConfig {
  code: string;
  name: string;
  defaultLocale: string;
}

export interface UserSettings {
  currency: string; // ISO 4217 code (USD, EUR, GBP, PKR, INR, AED, etc.)
  locale: string;
  hasCompletedOnboarding: boolean;
}

export interface CategorySummary {
  category: string;
  spent: number;
  budget: number;
  pct: number;
}

export interface FinancialContext {
  currency: string;
  locale: string;
  currentMonth: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyBudget: number;
  remainingBudget: number;
  daysLeftInMonth: number;
  avgDailySpendRemaining: number;
  categoryBreakdown: CategorySummary[];
  recentTransactions: Array<{
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note?: string;
    subscriptions?: SubscriptionItem[];
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isError?: boolean;
}

export type ActiveTab = 'dashboard' | 'add' | 'history' | 'advisor' | 'settings';

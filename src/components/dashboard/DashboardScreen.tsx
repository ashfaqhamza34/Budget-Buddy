import React, { useMemo } from 'react';
import { Transaction, MonthlyBudget, UserSettings, CustomCategory } from '../../types';
import { formatCurrency } from '../../utils/currencies';
import { getCategoryColor } from '../../utils/categories';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  AlertTriangle,
  Plus,
  ArrowRight,
  Sparkles,
  Repeat,
} from 'lucide-react';

interface DashboardScreenProps {
  transactions: Transaction[];
  budget: MonthlyBudget;
  settings: UserSettings;
  customCategories?: CustomCategory[];
  onNavigateToAdd: () => void;
  onNavigateToAdvisor: (question?: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToSettings: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  transactions,
  budget,
  settings,
  customCategories = [],
  onNavigateToAdd,
  onNavigateToAdvisor,
  onNavigateToHistory,
  onNavigateToSettings,
  onEditTransaction,
}) => {
  const { currency, locale } = settings;

  // Compute Current Month Dates
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, totalDaysInMonth - currentDay);

  const monthName = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  // Filter transactions for current month
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const [y, m] = t.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIdx + 1;
    });
  }, [transactions, currentYear, currentMonthIdx]);

  // Aggregate Income & Expenses
  const { totalIncome, totalExpenses, categoryTotals } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const catMap: Record<string, number> = {};

    for (const t of currentMonthTransactions) {
      if (t.type === 'income') {
        inc += t.amount;
      } else {
        exp += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    }

    return {
      totalIncome: inc,
      totalExpenses: exp,
      categoryTotals: catMap,
    };
  }, [currentMonthTransactions]);

  const netBalance = totalIncome - totalExpenses;

  // Monthly Budget metrics
  const monthlyBudget = budget.overallBudget || 0;
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - totalExpenses : 0;
  const budgetUsagePercent = monthlyBudget > 0 ? Math.min((totalExpenses / monthlyBudget) * 100, 100) : 0;
  const isOverBudget = monthlyBudget > 0 && totalExpenses > monthlyBudget;
  const isBudgetWarning = monthlyBudget > 0 && totalExpenses >= monthlyBudget * 0.9;

  // Average daily spend remaining
  const avgDailySpendRemaining =
    monthlyBudget > 0
      ? daysLeftInMonth > 0
        ? Math.max(0, remainingBudget / daysLeftInMonth)
        : Math.max(0, remainingBudget)
      : null;

  // Chart data sorted by spending
  const pieData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: getCategoryColor(name, customCategories),
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTotals, customCategories]);

  // Top spending categories with budget comparison
  const topCategories = useMemo(() => {
    return pieData.slice(0, 4).map((item) => {
      const catBudget = budget.categoryBudgets?.[item.name] || 0;
      const pct = catBudget > 0 ? Math.min((item.value / catBudget) * 100, 100) : 0;
      return {
        ...item,
        budget: catBudget,
        pct,
      };
    });
  }, [pieData, budget.categoryBudgets]);

  // Aggregate subscription services summary for the current month
  const currentMonthSubscriptionsSummary = useMemo(() => {
    const names = new Set<string>();
    for (const t of currentMonthTransactions) {
      if (t.category === 'Subscriptions' && t.subscriptions) {
        t.subscriptions.forEach((s) => {
          if (s.name) names.add(s.name);
        });
      }
    }
    if (names.size === 0) return null;
    return `Includes: ${Array.from(names).join(', ')}`;
  }, [currentMonthTransactions]);

  // 3 most recent transactions
  const recentTransactionsList = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (b.date !== a.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt))
      .slice(0, 3);
  }, [transactions]);

  return (
    <div className="flex flex-col space-y-4 p-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold text-teal-400 tracking-wide uppercase font-sans">
            {monthName}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight font-heading">Budget Buddy</h1>
        </div>

        {/* Currency & Quick Action */}
        <button
          onClick={onNavigateToSettings}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300 active:bg-slate-700 transition-colors min-h-[36px]"
          title="Change currency and settings"
        >
          <span className="font-semibold text-teal-400 tabular-nums">{currency}</span>
          <span className="text-[10px] text-slate-400 font-normal">({locale})</span>
        </button>
      </div>

      {/* Primary Balance & Cashflow Card */}
      <div
        id="card-balance-overview"
        className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/90 to-slate-900 border border-slate-700/70 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-400">Net Balance</span>
          <div className="flex items-center space-x-1 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span className="leading-[1.45]"><strong className="font-semibold text-slate-300 tabular-nums">{daysLeftInMonth}</strong> days left in month</span>
          </div>
        </div>

        {/* Animated Net Balance */}
        <div className="text-3xl font-bold tracking-tight my-1 tabular-nums">
          <AnimatedNumber
            value={netBalance}
            currency={currency}
            locale={locale}
            className={netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            showSign={false}
          />
        </div>

        {/* Income and Expense sub-pills */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700/50">
          <div className="flex items-center space-x-2.5 p-2 rounded-2xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-medium text-slate-400 block truncate">Total Income</span>
              <span className="text-sm font-semibold text-white block truncate tabular-nums">
                {formatCurrency(totalIncome, currency, locale)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 p-2 rounded-2xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-[11px] font-medium text-slate-400 block truncate">Total Spent</span>
              <span className="text-sm font-semibold text-white block truncate tabular-nums">
                {formatCurrency(totalExpenses, currency, locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget & Daily Spend Card */}
      <div
        id="card-monthly-budget"
        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold text-slate-200 font-heading tracking-tight">Monthly Budget</span>
          </div>

          {monthlyBudget > 0 ? (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                isOverBudget
                  ? 'bg-rose-500/20 text-rose-300'
                  : isBudgetWarning
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-teal-500/20 text-teal-300'
              }`}
            >
              {isOverBudget
                ? 'Budget Exceeded'
                : `${Math.round(budgetUsagePercent)}% used`}
            </span>
          ) : (
            <button
              onClick={onNavigateToSettings}
              className="text-xs text-teal-400 font-medium underline active:opacity-75"
            >
              Set Budget
            </button>
          )}
        </div>

        {monthlyBudget > 0 ? (
          <div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden my-2">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : isBudgetWarning
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>
                Spent: <strong className="text-white font-semibold tabular-nums">{formatCurrency(totalExpenses, currency, locale)}</strong>
              </span>
              <span>
                Budget: <strong className="text-white font-semibold tabular-nums">{formatCurrency(monthlyBudget, currency, locale)}</strong>
              </span>
            </div>

            {/* Daily spend remaining pill */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOverBudget ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Calendar className="w-4 h-4 text-teal-400 shrink-0" />
                )}
                <span className="text-xs text-slate-300 font-normal leading-[1.45]">
                  {isOverBudget ? 'Over-budget by' : 'Average daily spend remaining'}
                </span>
              </div>
              <span className={`text-xs font-semibold tabular-nums ${isOverBudget ? 'text-rose-400' : 'text-teal-300'}`}>
                {isOverBudget
                  ? formatCurrency(totalExpenses - monthlyBudget, currency, locale)
                  : avgDailySpendRemaining != null
                  ? `${formatCurrency(avgDailySpendRemaining, currency, locale)}/day`
                  : 'N/A'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-800/40 text-center my-1">
            <p className="text-xs text-slate-400 mb-2 leading-[1.45]">
              Set a monthly spending budget to calculate daily spending limits and budget alerts.
            </p>
            <button
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-medium"
            >
              Configure Budget Target
            </button>
          </div>
        )}
      </div>

      {/* Visual Spending Breakdown (Recharts Donut Chart) */}
      <div
        id="card-spending-chart"
        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white font-heading tracking-tight">Spending by Category</h2>
          {currentMonthTransactions.length > 0 && (
            <button
              onClick={onNavigateToHistory}
              className="text-xs text-teal-400 font-medium flex items-center space-x-1 active:opacity-75"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {pieData.length > 0 ? (
          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div className="w-full h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val) || 0, currency, locale),
                      'Spent',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase font-semibold font-sans">Total</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {formatCurrency(totalExpenses, currency, locale, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Top Categories Progress bars */}
            <div className="w-full space-y-2.5 mt-2">
              {topCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-slate-200 font-medium block truncate">{cat.name}</span>
                        {cat.name === 'Subscriptions' && currentMonthSubscriptionsSummary && (
                          <span className="text-[11px] text-slate-400 block truncate leading-tight mt-0.5">
                            {currentMonthSubscriptionsSummary}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-300 font-semibold tabular-nums shrink-0 ml-2">
                      {formatCurrency(cat.value, currency, locale)}
                    </span>
                  </div>

                  {cat.budget > 0 && (
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.pct >= 90 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${Math.min(cat.pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="py-8 px-4 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300 font-heading">No expenses logged yet</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 leading-[1.45]">
              Add your first expense to see your category breakdown and visual donut chart.
            </p>
            <button
              onClick={onNavigateToAdd}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-medium shadow-md min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity Card */}
      {recentTransactionsList.length > 0 && (
        <div
          id="card-recent-activity"
          className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-heading tracking-tight">
              Recent Activity
            </h3>
            <button
              id="btn-view-all-history"
              onClick={onNavigateToHistory}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center space-x-1 p-1 -mr-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {recentTransactionsList.map((t) => {
              const isExpense = t.type === 'expense';
              return (
                <div
                  key={t.id}
                  id={`recent-tx-${t.id}`}
                  onClick={() => (onEditTransaction ? onEditTransaction(t) : onNavigateToHistory())}
                  className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 active:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer min-h-[52px]"
                >
                  <div className="overflow-hidden mr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-white truncate">
                        {t.category}
                      </span>
                      {t.isRecurring && (
                        <span
                          className="inline-flex items-center space-x-0.5 text-[9px] text-teal-300 bg-teal-500/15 border border-teal-500/30 px-1 py-0.2 rounded font-medium shrink-0"
                          title="Recurring transaction"
                        >
                          <Repeat className="w-2.5 h-2.5 text-teal-400" />
                          <span>Recurring</span>
                        </span>
                      )}
                    </div>
                    {t.category === 'Subscriptions' && t.subscriptions && t.subscriptions.length > 0 && (
                      <div className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                        Includes: {t.subscriptions.map((s) => s.name).join(', ')}
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500 block tabular-nums mt-0.5">
                      {t.date}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-semibold block tabular-nums ${
                        isExpense ? 'text-white' : 'text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatCurrency(t.amount, currency, locale)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Financial Advisor Quick Banner with Concrete Suggestion Chips */}
      <div
        id="card-advisor-banner"
        className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 border border-teal-500/30 shadow-xl space-y-3"
      >
        <div
          onClick={() => onNavigateToAdvisor()}
          className="flex items-center justify-between cursor-pointer active:opacity-85"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white font-heading tracking-tight">
                AI Financial Advisor
              </h3>
              <p className="text-xs text-slate-400 font-normal leading-[1.45]">
                Tap a question or ask anything about your finances
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-400 shrink-0" />
        </div>

        {/* Tappable / Clickable Suggestion Chips */}
        <div className="space-y-2 pt-1">
          {[
            'Can I afford a new pair of shoes this week?',
            'Where am I overspending this month?',
            'How much can I save if I cut eating out?',
          ].map((question, idx) => (
            <button
              key={idx}
              id={`overview-ai-chip-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToAdvisor(question);
              }}
              className="w-full text-left p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-200 active:scale-[0.99] transition-all flex items-center justify-between min-h-[44px] group"
            >
              <span className="leading-[1.45] font-normal">"{question}"</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-400 opacity-60 group-hover:opacity-100 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

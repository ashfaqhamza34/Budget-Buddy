import React, { useState, useMemo } from 'react';
import { Transaction, UserSettings, EXPENSE_CATEGORIES, INCOME_SOURCES, CustomCategory } from '../../types';
import { formatCurrency } from '../../utils/currencies';
import {
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  X,
  FileText,
  Repeat,
} from 'lucide-react';

interface HistoryScreenProps {
  transactions: Transaction[];
  settings: UserSettings;
  customCategories?: CustomCategory[];
  onEditTransaction: (transaction: Transaction) => void;
  onNavigateToAdd: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  transactions,
  settings,
  customCategories = [],
  onEditTransaction,
  onNavigateToAdd,
}) => {
  const { currency, locale } = settings;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract unique available months from transactions
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.slice(0, 7)); // YYYY-MM
      }
    }
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Combined categories including custom categories
  const allCategories = useMemo(() => {
    const set = new Set([
      ...EXPENSE_CATEGORIES,
      ...customCategories.map((c) => c.name),
      ...INCOME_SOURCES,
      ...transactions.map((t) => t.category),
    ]);
    return Array.from(set);
  }, [customCategories, transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

        // Month filter
        if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;

        // Search text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNote = t.note?.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchAmt = String(t.amount).includes(q);
          if (!matchNote && !matchCat && !matchAmt) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort newest date first, then newest creation
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt - a.createdAt;
      });
  }, [transactions, typeFilter, selectedCategory, selectedMonth, searchQuery]);

  // Summary totals for currently filtered items
  const { filteredIncome, filteredExpenses } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    }
    return { filteredIncome: inc, filteredExpenses: exp };
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSelectedCategory('all');
    setSelectedMonth('all');
  };

  const hasActiveFilters =
    searchQuery || typeFilter !== 'all' || selectedCategory !== 'all' || selectedMonth !== 'all';

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-24">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight font-heading">Spending History</h1>
        <p className="text-xs text-slate-400 mt-0.5 leading-[1.45]">Filter, search, and manage your logs</p>

        {/* Search input */}
        <div className="relative mt-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            id="input-history-search"
            placeholder="Search notes, categories, or amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-2 flex items-center text-slate-400 active:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 mt-3 overflow-x-auto pb-1">
          {/* Type filters */}
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              id={`filter-type-${t}`}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap min-h-[36px] transition-colors ${
                typeFilter === t
                  ? 'bg-teal-500 text-slate-950 shadow-sm font-semibold'
                  : 'bg-slate-800 text-slate-300 active:bg-slate-700'
              }`}
            >
              {t === 'all' ? 'All Types' : t === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}

          {/* Month selector dropdown */}
          {availableMonths.length > 0 && (
            <select
              id="filter-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs rounded-full px-3 py-1.5 border border-slate-700 focus:outline-none min-h-[36px] tabular-nums"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Category selector dropdown */}
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-slate-300 text-xs rounded-full px-3 py-1.5 border border-slate-700 focus:outline-none min-h-[36px]"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-400 font-semibold underline whitespace-nowrap px-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filter summary totals banner */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2 rounded-xl bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-medium">Filtered Income</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              +{formatCurrency(filteredIncome, currency, locale)}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/50">
            <span className="text-slate-400 block text-[10px] font-medium">Filtered Spent</span>
            <span className="text-rose-400 font-semibold tabular-nums">
              -{formatCurrency(filteredExpenses, currency, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="p-4 space-y-2.5">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const isExpense = t.type === 'expense';
            return (
              <div
                key={t.id}
                id={`tx-item-${t.id}`}
                onClick={() => onEditTransaction(t)}
                className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 active:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer min-h-[64px]"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isExpense
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isExpense ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white truncate">
                        {t.category}
                      </span>
                      {t.isRecurring && (
                        <span
                          id={`badge-recurring-${t.id}`}
                          className="inline-flex items-center space-x-1 text-[10px] text-teal-300 bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 rounded-md font-medium shrink-0"
                          title="Recurring transaction"
                        >
                          <Repeat className="w-2.5 h-2.5 text-teal-400" />
                          <span>Recurring</span>
                        </span>
                      )}
                    </div>
                    {t.category === 'Subscriptions' && t.subscriptions && t.subscriptions.length > 0 && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate leading-snug">
                        Includes: {t.subscriptions.map((s) => s.name).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="tabular-nums">{t.date}</span>
                      {t.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] text-slate-300">
                            {t.note}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`text-sm font-semibold block tabular-nums ${
                      isExpense ? 'text-white' : 'text-emerald-400'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {formatCurrency(t.amount, currency, locale)}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    {t.type}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="py-12 px-4 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200 font-heading">
              {hasActiveFilters ? 'No matching transactions' : 'No transactions recorded'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 leading-[1.45]">
              {hasActiveFilters
                ? 'Try adjusting your search query or filters to find what you are looking for.'
                : 'Start logging your daily income and expenses to see your complete history.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={onNavigateToAdd}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium min-h-[44px]"
              >
                Add First Transaction
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

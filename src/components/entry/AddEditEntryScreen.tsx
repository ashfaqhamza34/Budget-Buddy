import React, { useState, useEffect, useMemo } from 'react';
import {
  Transaction,
  TransactionType,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  UserSettings,
  CustomCategory,
  SubscriptionItem,
  RecurringFrequency,
} from '../../types';
import { parseCleanAmount, formatCurrency } from '../../utils/currencies';
import {
  getCategoryIcon,
  PRESET_CATEGORY_COLORS,
  PRESET_CATEGORY_ICONS,
} from '../../utils/categories';
import {
  DEFAULT_SUBSCRIPTION_SERVICES,
  getStoredCustomSubscriptionServices,
  addCustomSubscriptionService,
} from '../../utils/subscriptions';
import { addFrequencyToDate, formatFrequencyLabel } from '../../utils/recurring';
import {
  ArrowLeft,
  Check,
  Trash2,
  Calendar,
  FileText,
  Plus,
  X,
  ChevronDown,
  Repeat,
} from 'lucide-react';

interface SubLineItem {
  id: string;
  name: string;
  amountStr: string;
  isCustom: boolean;
}

export interface RecurringConfig {
  repeats: boolean;
  frequency: RecurringFrequency;
}

interface AddEditEntryScreenProps {
  settings: UserSettings;
  customCategories: CustomCategory[];
  editingTransaction?: Transaction | null;
  onSave: (
    entry: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    recurringConfig?: RecurringConfig
  ) => void;
  onAddCustomCategory: (category: CustomCategory) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

export const AddEditEntryScreen: React.FC<AddEditEntryScreenProps> = ({
  settings,
  customCategories,
  editingTransaction,
  onSave,
  onAddCustomCategory,
  onDelete,
  onCancel,
}) => {
  const { currency, locale } = settings;

  const [type, setType] = useState<TransactionType>(editingTransaction?.type || 'expense');
  const [amountStr, setAmountStr] = useState(
    editingTransaction ? String(editingTransaction.amount) : ''
  );
  const [category, setCategory] = useState<string>(
    editingTransaction?.category || (type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_SOURCES[0])
  );
  const [date, setDate] = useState<string>(
    editingTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>(editingTransaction?.note || '');
  const [error, setError] = useState<string | null>(null);

  // Recurring transaction state
  const [isRecurring, setIsRecurring] = useState<boolean>(
    editingTransaction?.isRecurring || false
  );
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');

  // Custom Category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_CATEGORY_COLORS[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState(PRESET_CATEGORY_ICONS[0].key);
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  // Subscriptions multi-line items state
  const [customServices, setCustomServices] = useState<string[]>(() =>
    getStoredCustomSubscriptionServices()
  );

  const [subscriptionItems, setSubscriptionItems] = useState<SubLineItem[]>(() => {
    if (editingTransaction?.category === 'Subscriptions') {
      if (editingTransaction.subscriptions && editingTransaction.subscriptions.length > 0) {
        const storedCustom = getStoredCustomSubscriptionServices();
        return editingTransaction.subscriptions.map((s) => ({
          id: s.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: s.name,
          amountStr: String(s.amount),
          isCustom:
            !DEFAULT_SUBSCRIPTION_SERVICES.includes(s.name) &&
            !storedCustom.includes(s.name),
        }));
      } else if (editingTransaction.amount > 0) {
        return [
          {
            id: `sub-${Date.now()}-1`,
            name: 'Netflix',
            amountStr: String(editingTransaction.amount),
            isCustom: false,
          },
        ];
      }
    }
    return [
      {
        id: `sub-${Date.now()}-1`,
        name: 'Netflix',
        amountStr: '',
        isCustom: false,
      },
    ];
  });

  const isSubscriptionCategory = type === 'expense' && category === 'Subscriptions';

  // Subscriptions running total calculation
  const subscriptionsTotal = useMemo(() => {
    return subscriptionItems.reduce((acc, it) => {
      const val = parseCleanAmount(it.amountStr);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [subscriptionItems]);

  // Live "Includes: Service1, Service2" summary
  const activeServicesSummary = useMemo(() => {
    const names = subscriptionItems
      .map((it) => it.name.trim())
      .filter(Boolean);
    if (names.length === 0) return null;
    return `Includes: ${names.join(', ')}`;
  }, [subscriptionItems]);

  // Sync category options when switching type
  useEffect(() => {
    if (!editingTransaction) {
      setCategory(type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_SOURCES[0]);
    }
  }, [type, editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setError('Please select a category or source.');
      return;
    }

    if (!date) {
      setError('Please select a valid transaction date.');
      return;
    }

    // Subscriptions roll-up logic
    if (isSubscriptionCategory) {
      const validSubscriptions: SubscriptionItem[] = [];
      for (const item of subscriptionItems) {
        const itemAmount = parseCleanAmount(item.amountStr);
        const itemName = item.name.trim();
        if (itemName && itemAmount > 0) {
          validSubscriptions.push({
            id: item.id || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: itemName,
            amount: itemAmount,
          });
        }
      }

      if (validSubscriptions.length === 0) {
        setError('Please add at least one subscription line-item with a valid name and amount greater than 0.');
        return;
      }

      // Remember any custom service names
      for (const item of validSubscriptions) {
        addCustomSubscriptionService(item.name);
      }
      setCustomServices(getStoredCustomSubscriptionServices());

      const totalSubscriptionsAmount =
        Math.round(validSubscriptions.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;

      setError(null);
      onSave(
        {
          type: 'expense',
          amount: totalSubscriptionsAmount,
          category: 'Subscriptions',
          date,
          note: note.trim() || undefined,
          subscriptions: validSubscriptions,
          isRecurring: isRecurring || editingTransaction?.isRecurring || false,
          recurringTemplateId: editingTransaction?.recurringTemplateId,
        },
        editingTransaction?.id,
        { repeats: isRecurring, frequency }
      );
      return;
    }

    // Standard single amount logic for all other categories
    const cleanAmount = parseCleanAmount(amountStr);

    if (cleanAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setError(null);
    onSave(
      {
        type,
        amount: cleanAmount,
        category,
        date,
        note: note.trim() || undefined,
        subscriptions: undefined,
        isRecurring: isRecurring || editingTransaction?.isRecurring || false,
        recurringTemplateId: editingTransaction?.recurringTemplateId,
      },
      editingTransaction?.id,
      { repeats: isRecurring, frequency }
    );
  };

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryModalError('Category name cannot be empty.');
      return;
    }

    // Case-insensitive duplicate check against built-in and existing custom categories
    const existingNames = [
      ...EXPENSE_CATEGORIES,
      ...INCOME_SOURCES,
      ...customCategories.map((c) => c.name),
    ];
    const isDuplicate = existingNames.some(
      (name) => name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setCategoryModalError('A category with this name already exists.');
      return;
    }

    const newCat: CustomCategory = {
      id: `custom-cat-${Date.now()}`,
      name: trimmed,
      color: newCategoryColor,
      icon: newCategoryIcon,
    };

    onAddCustomCategory(newCat);
    setCategory(trimmed);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setCategoryModalError(null);
  };

  const categoriesToDisplay =
    type === 'expense'
      ? [...EXPENSE_CATEGORIES, ...customCategories.map((c) => c.name)]
      : INCOME_SOURCES;

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
        <button
          id="btn-entry-back"
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full text-slate-400 active:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-base font-bold text-white font-heading tracking-tight">
          {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
        </h2>

        {editingTransaction && onDelete ? (
          <button
            id="btn-entry-delete"
            onClick={() => onDelete(editingTransaction.id)}
            className="p-2 -mr-2 rounded-full text-rose-400 active:text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Delete transaction"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        {/* Expense / Income Segmented Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            id="toggle-type-expense"
            onClick={() => setType('expense')}
            className={`py-2.5 text-xs font-semibold rounded-xl transition-all min-h-[44px] flex items-center justify-center space-x-1.5 ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                : 'text-slate-400 active:text-slate-200'
            }`}
          >
            <span>Expense</span>
          </button>
          <button
            type="button"
            id="toggle-type-income"
            onClick={() => setType('income')}
            className={`py-2.5 text-xs font-semibold rounded-xl transition-all min-h-[44px] flex items-center justify-center space-x-1.5 ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 active:text-slate-200'
            }`}
          >
            <span>Income</span>
          </button>
        </div>

        {/* Subscriptions Multi-Item Section or Big Amount Input */}
        {isSubscriptionCategory ? (
          <div
            id="subscriptions-editor-section"
            className="p-4 rounded-3xl bg-slate-800/50 border border-teal-500/40 shadow-xl space-y-4"
          >
            {/* Running Total Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div>
                <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block">
                  Subscriptions Total
                </span>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  {subscriptionItems.length} {subscriptionItems.length === 1 ? 'service' : 'services'} included
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-white tabular-nums tracking-tight font-sans">
                  {formatCurrency(subscriptionsTotal, currency, locale)}
                </span>
              </div>
            </div>

            {/* Live "Includes:" secondary summary line */}
            {activeServicesSummary && (
              <div className="text-xs text-teal-300/90 font-medium truncate py-1.5 px-3 rounded-xl bg-teal-950/50 border border-teal-500/30">
                {activeServicesSummary}
              </div>
            )}

            {/* List of individual subscription line-items */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Services & Amounts
                </span>
                <span className="text-[11px] text-slate-400">
                  Select service or type custom
                </span>
              </div>

              {subscriptionItems.map((item, index) => (
                <div
                  key={item.id}
                  id={`subscription-row-${index}`}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    {/* Service selector or custom text input */}
                    <div className="flex-1 min-w-0">
                      {item.isCustom ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Duolingo, Strava..."
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSubscriptionItems((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, name: val } : it))
                              );
                              if (error) setError(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-teal-500/60 text-white text-xs font-medium focus:outline-none focus:border-teal-400 placeholder-slate-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSubscriptionItems((prev) =>
                                prev.map((it) =>
                                  it.id === item.id
                                    ? { ...it, isCustom: false, name: DEFAULT_SUBSCRIPTION_SERVICES[0] }
                                    : it
                                )
                              );
                            }}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[10px] font-medium shrink-0 border border-slate-700 min-h-[32px]"
                            title="Back to presets"
                          >
                            Presets
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                setSubscriptionItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id ? { ...it, isCustom: true, name: '' } : it
                                  )
                                );
                              } else {
                                setSubscriptionItems((prev) =>
                                  prev.map((it) => (it.id === item.id ? { ...it, name: val } : it))
                                );
                              }
                              if (error) setError(null);
                            }}
                            className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700/80 text-white text-xs font-medium appearance-none focus:outline-none focus:border-teal-500 cursor-pointer truncate"
                          >
                            <optgroup label="Preset Services">
                              {DEFAULT_SUBSCRIPTION_SERVICES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </optgroup>
                            {customServices.length > 0 && (
                              <optgroup label="Saved Custom Services">
                                {customServices.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="__custom__">+ Add Custom...</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* Amount input */}
                    <div className="w-28 shrink-0 relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold tabular-nums">
                        {currency}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        placeholder="0.00"
                        value={item.amountStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setSubscriptionItems((prev) =>
                            prev.map((it) => (it.id === item.id ? { ...it, amountStr: val } : it))
                          );
                          if (error) setError(null);
                        }}
                        className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700/80 text-white text-right text-xs font-semibold tabular-nums focus:outline-none focus:border-teal-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (subscriptionItems.length === 1) {
                          setSubscriptionItems([
                            {
                              id: `sub-${Date.now()}`,
                              name: DEFAULT_SUBSCRIPTION_SERVICES[0],
                              amountStr: '',
                              isCustom: false,
                            },
                          ]);
                        } else {
                          setSubscriptionItems((prev) => prev.filter((it) => it.id !== item.id));
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors shrink-0 min-h-[36px] flex items-center justify-center"
                      title="Remove subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* + Add Another Subscription button */}
              <button
                type="button"
                id="btn-add-another-sub"
                onClick={() => {
                  const usedLower = subscriptionItems.map((s) => s.name.toLowerCase());
                  const nextPreset =
                    DEFAULT_SUBSCRIPTION_SERVICES.find((s) => !usedLower.includes(s.toLowerCase())) ||
                    DEFAULT_SUBSCRIPTION_SERVICES[0];
                  setSubscriptionItems((prev) => [
                    ...prev,
                    {
                      id: `sub-${Date.now()}-${prev.length + 1}`,
                      name: nextPreset,
                      amountStr: '',
                      isCustom: false,
                    },
                  ]);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-dashed border-teal-500/50 hover:border-teal-500/80 text-teal-300 text-xs font-medium flex items-center justify-center space-x-2 transition-colors min-h-[44px]"
              >
                <Plus className="w-4 h-4 text-teal-400" />
                <span>+ Add Another Subscription</span>
              </button>
            </div>
          </div>
        ) : (
          /* Big Amount Input with Currency Code Indicator */
          <div className="p-4 rounded-3xl bg-slate-800/40 border border-slate-700/70 text-center">
            <span className="text-xs font-medium text-slate-400 block mb-1">
              Amount ({currency})
            </span>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl font-semibold text-slate-500 tabular-nums">{currency}</span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.]?[0-9]*"
                id="input-entry-amount"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  // allow numeric digits and single decimal dot
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setAmountStr(val);
                  if (error) setError(null);
                }}
                autoFocus={!editingTransaction}
                className="text-4xl font-bold text-white bg-transparent text-center focus:outline-none placeholder-slate-600 w-52 max-w-full tabular-nums tracking-tight"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium leading-[1.45]">
            {error}
          </div>
        )}

        {/* Category Picker Grid */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {type === 'expense' ? 'Expense Category' : 'Income Source'}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {categoriesToDisplay.map((catName) => {
              const isSelected = category === catName;
              const Icon = getCategoryIcon(catName, customCategories);

              return (
                <button
                  type="button"
                  key={catName}
                  id={`cat-chip-${catName.toLowerCase()}`}
                  onClick={() => setCategory(catName)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all min-h-[56px] border ${
                    isSelected
                      ? type === 'expense'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-300 active:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-medium truncate w-full text-center">
                    {catName}
                  </span>
                </button>
              );
            })}

            {type === 'expense' && (
              <button
                type="button"
                id="btn-add-custom-category"
                onClick={() => {
                  setIsAddingCategory(true);
                  setCategoryModalError(null);
                }}
                className="p-2.5 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all min-h-[56px] border border-dashed border-teal-500/60 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 active:scale-95"
              >
                <Plus className="w-5 h-5 text-teal-400" />
                <span className="text-[11px] font-medium truncate w-full text-center">
                  + Custom
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              id="input-entry-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] tabular-nums"
            />
          </div>
        </div>

        {/* Optional Note / Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
            Note (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="input-entry-note"
              placeholder="e.g. Grocery trip, dinner with friends"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Recurring "This repeats" Section */}
        <div
          id="recurring-toggle-card"
          className={`p-4 rounded-2xl border transition-all ${
            isRecurring
              ? 'bg-teal-950/40 border-teal-500/50 shadow-md'
              : 'bg-slate-800/40 border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isRecurring ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <label
                  htmlFor="checkbox-this-repeats"
                  className="text-xs font-semibold text-white block cursor-pointer select-none"
                >
                  This repeats
                </label>
                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                  Automatically log recurring {type === 'expense' ? 'expense' : 'income'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer min-w-[48px] min-h-[44px] justify-end">
              <input
                type="checkbox"
                id="checkbox-this-repeats"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:right-[22px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          {/* Frequency selector when enabled */}
          {isRecurring && (
            <div className="mt-3 pt-3 border-t border-teal-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">
                  Repeat Frequency
                </label>
                <span className="text-[10px] text-teal-400/80">
                  {formatFrequencyLabel(frequency)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                  <button
                    type="button"
                    key={freq}
                    id={`btn-freq-${freq}`}
                    onClick={() => setFrequency(freq)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize transition-all min-h-[40px] border ${
                      frequency === freq
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700/80'
                    }`}
                  >
                    {freq === 'weekly' ? 'Weekly' : freq === 'monthly' ? 'Monthly' : 'Yearly'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug pt-1">
                Next occurrence auto-logs on{' '}
                <span className="text-teal-300 font-semibold tabular-nums">
                  {addFrequencyToDate(date, frequency)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-save-entry"
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-teal-950/40 flex items-center justify-center space-x-2 transition-all min-h-[48px]"
          >
            <Check className="w-5 h-5" />
            <span>{editingTransaction ? 'Save Changes' : 'Add Entry'}</span>
          </button>
        </div>
      </form>

      {/* Custom Category Creation Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-heading tracking-tight">
                New Custom Category
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setCategoryModalError(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  id="input-custom-cat-name"
                  placeholder="e.g. Coffee, Gym, Travel, Pets"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (categoryModalError) setCategoryModalError(null);
                  }}
                  autoFocus
                  maxLength={30}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>

              {categoryModalError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {categoryModalError}
                </div>
              )}

              {/* Color Preset Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Pick Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_CATEGORY_COLORS.map((col) => {
                    const isSelected = newCategoryColor === col;
                    return (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setNewCategoryColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        aria-label={`Color ${col}`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Preset Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Pick Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_CATEGORY_ICONS.map((item) => {
                    const isSelected = newCategoryIcon === item.key;
                    const IconComp = item.icon;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setNewCategoryIcon(item.key)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all min-h-[44px] ${
                          isSelected
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setCategoryModalError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-custom-category"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold min-h-[44px] shadow-lg shadow-teal-950/40"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

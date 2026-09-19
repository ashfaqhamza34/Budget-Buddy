import React, { useState, useMemo } from 'react';
import {
  UserSettings,
  MonthlyBudget,
  EXPENSE_CATEGORIES,
  CustomCategory,
  RecurringTemplate,
} from '../../types';
import {
  SUPPORTED_CURRENCIES,
  COMMON_LOCALES,
  formatCurrency,
  parseCleanAmount,
} from '../../utils/currencies';
import { getCategoryIcon } from '../../utils/categories';
import { RecurringTemplatesSection } from './RecurringTemplatesSection';
import {
  Globe,
  Wallet,
  RotateCcw,
  Sparkles,
  Check,
  Info,
  Tag,
  Trash2,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: UserSettings;
  budget: MonthlyBudget;
  customCategories: CustomCategory[];
  recurringTemplates: RecurringTemplate[];
  onUpdateSettings: (newSettings: UserSettings) => void;
  onUpdateBudget: (newBudget: MonthlyBudget) => void;
  onDeleteCustomCategory: (categoryName: string) => void;
  onUpdateRecurringTemplate: (updated: RecurringTemplate) => void;
  onTogglePauseRecurringTemplate: (id: string) => void;
  onDeleteRecurringTemplate: (id: string) => void;
  onResetAllData: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  budget,
  customCategories,
  recurringTemplates,
  onUpdateSettings,
  onUpdateBudget,
  onDeleteCustomCategory,
  onUpdateRecurringTemplate,
  onTogglePauseRecurringTemplate,
  onDeleteRecurringTemplate,
  onResetAllData,
}) => {
  const { currency, locale } = settings;

  const allExpenseCategories = useMemo(() => {
    return [...EXPENSE_CATEGORIES, ...customCategories.map((c) => c.name)];
  }, [customCategories]);

  // Local editing states
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [overallBudgetStr, setOverallBudgetStr] = useState(String(budget.overallBudget || ''));
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const cat of [...EXPENSE_CATEGORIES, ...customCategories.map((c) => c.name)]) {
      initial[cat] = budget.categoryBudgets?.[cat] ? String(budget.categoryBudgets[cat]) : '';
    }
    return initial;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAiInfo, setShowAiInfo] = useState(false);

  const handleCurrencyChange = (newCode: string) => {
    setSelectedCurrency(newCode);
    const matched = SUPPORTED_CURRENCIES.find((c) => c.code === newCode);
    if (matched && matched.defaultLocale) {
      setSelectedLocale(matched.defaultLocale);
    }
  };

  const handleSaveBudgetAndSettings = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update settings
    onUpdateSettings({
      currency: selectedCurrency,
      locale: selectedLocale,
      hasCompletedOnboarding: true,
    });

    // 2. Update budget
    const cleanOverall = parseCleanAmount(overallBudgetStr);
    const cleanCategories: Record<string, number> = {};
    for (const [cat, valStr] of Object.entries(categoryBudgets)) {
      const val = parseCleanAmount(valStr);
      if (val > 0) {
        cleanCategories[cat] = val;
      }
    }

    onUpdateBudget({
      overallBudget: cleanOverall,
      categoryBudgets: cleanCategories,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto pb-24">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-tight font-heading">Settings & Preferences</h1>
        <p className="text-xs text-slate-400 mt-0.5 leading-[1.45]">Customize currency, locale, and budget limits</p>
      </div>

      <form onSubmit={handleSaveBudgetAndSettings} className="p-4 space-y-6">
        {/* Currency & Locale Section */}
        <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/60 space-y-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-teal-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-heading">
              Currency & Locale
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Default Currency (ISO 4217)
            </label>
            <select
              id="settings-currency-select"
              value={selectedCurrency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] tabular-nums"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Locale (Number & Date Formatting)
            </label>
            <select
              id="settings-locale-select"
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              {COMMON_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Sample Formatted:</span>
            <span className="font-semibold text-teal-300 tabular-nums">
              {formatCurrency(2450.8, selectedCurrency, selectedLocale)}
            </span>
          </div>
        </div>

        {/* Monthly Budget Section */}
        <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/60 space-y-4">
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-teal-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-heading">
              Monthly Budget Goals
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Overall Monthly Budget ({selectedCurrency})
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                id="input-overall-budget"
                placeholder="e.g. 2500"
                value={overallBudgetStr}
                onChange={(e) => setOverallBudgetStr(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] tabular-nums"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 leading-[1.45]">
              Used to calculate remaining daily allowance and budget limit alerts.
            </span>
          </div>

          {/* Category sub-budgets */}
          <div className="pt-2 border-t border-slate-700/60">
            <span className="text-xs font-medium text-slate-300 block mb-2 font-sans">
              Per-Category Sub-budgets (Optional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allExpenseCategories.map((cat) => (
                <div key={cat} className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[11px] font-medium text-slate-300 block truncate mb-1">
                    {cat}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    id={`input-cat-budget-${cat.toLowerCase()}`}
                    placeholder="0"
                    value={categoryBudgets[cat] || ''}
                    onChange={(e) =>
                      setCategoryBudgets({ ...categoryBudgets, [cat]: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Categories Management */}
        {customCategories.length > 0 && (
          <div className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/60 space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-teal-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-heading">
                Custom Categories
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-[1.45]">
              Categories you created. Deleting a category moves existing entries in that category to "Other".
            </p>
            <div className="space-y-2 pt-1">
              {customCategories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.name, customCategories);
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between min-h-[44px]"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color || '#0d9488' }}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-white">{cat.name}</span>
                    </div>
                    <button
                      type="button"
                      id={`btn-delete-custom-cat-${cat.name.toLowerCase()}`}
                      onClick={() => onDeleteCustomCategory(cat.name)}
                      className="p-2 text-rose-400 hover:text-rose-300 active:text-rose-200 rounded-xl hover:bg-rose-500/10 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                      title={`Delete category ${cat.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recurring Transactions Management Section */}
        <RecurringTemplatesSection
          recurringTemplates={recurringTemplates}
          currency={currency}
          locale={locale}
          customCategories={customCategories}
          onUpdateRecurringTemplate={onUpdateRecurringTemplate}
          onTogglePauseRecurringTemplate={onTogglePauseRecurringTemplate}
          onDeleteRecurringTemplate={onDeleteRecurringTemplate}
        />

        {/* Save Settings Button */}
        <div>
          <button
            type="submit"
            id="btn-save-settings"
            className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-teal-950/40 flex items-center justify-center space-x-2 transition-all min-h-[48px]"
          >
            <Check className="w-5 h-5" />
            <span>{savedSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

        {/* Reset Action & Privacy Reassurance */}
        <div className="pt-2 space-y-2">
          {confirmReset ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 space-y-2">
              <span className="text-xs font-semibold text-rose-300 block leading-[1.45]">
                Are you sure? This erases all transactions, custom categories, and chats.
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  id="btn-confirm-reset"
                  onClick={() => {
                    onResetAllData();
                    setConfirmReset(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold min-h-[44px]"
                >
                  Yes, Erase Everything
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              id="btn-trigger-reset"
              onClick={() => setConfirmReset(true)}
              className="w-full p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-rose-400 border border-slate-700/50 text-xs font-medium flex items-center justify-center space-x-2 transition-colors min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Data to Default</span>
            </button>
          )}

          <p className="text-center text-[11px] text-slate-400 font-normal leading-[1.45] pt-1">
            Your data stays on this device. Nothing is uploaded or shared.
          </p>
        </div>

        {/* AI Advisor Info Card */}
        <div className="p-4 rounded-3xl bg-slate-800/30 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300 text-xs">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="font-semibold font-heading">Advisor powered by AI</span>
            </div>
            <button
              type="button"
              id="btn-settings-ai-info"
              onClick={() => setShowAiInfo((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-200 active:text-white rounded-lg flex items-center justify-center min-w-[36px] min-h-[36px]"
              aria-label="AI info"
              title="Learn about AI advisor"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          {showAiInfo && (
            <p className="text-[11px] text-slate-400 leading-[1.45] pt-1 border-t border-slate-800">
              Responses are AI-generated and may not always be accurate.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

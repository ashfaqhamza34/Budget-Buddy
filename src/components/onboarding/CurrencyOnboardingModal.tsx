import React, { useState } from 'react';
import { SUPPORTED_CURRENCIES, COMMON_LOCALES, formatCurrency } from '../../utils/currencies';
import { UserSettings } from '../../types';
import { Sparkles, Globe, CheckCircle2 } from 'lucide-react';

interface CurrencyOnboardingModalProps {
  initialSettings: UserSettings;
  onComplete: (settings: UserSettings, loadSampleData: boolean) => void;
}

export const CurrencyOnboardingModal: React.FC<CurrencyOnboardingModalProps> = ({
  initialSettings,
  onComplete,
}) => {
  const [currency, setCurrency] = useState(initialSettings.currency || 'USD');
  const [locale, setLocale] = useState(initialSettings.locale || 'en-US');
  const [includeDemoData, setIncludeDemoData] = useState(true);

  const handleCurrencyChange = (newCode: string) => {
    setCurrency(newCode);
    const matched = SUPPORTED_CURRENCIES.find((c) => c.code === newCode);
    if (matched && matched.defaultLocale) {
      setLocale(matched.defaultLocale);
    }
  };

  const handleSave = () => {
    onComplete(
      {
        currency,
        locale,
        hasCompletedOnboarding: true,
      },
      includeDemoData
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4">
      <div
        id="onboarding-modal"
        className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight font-heading">Welcome to Budget Buddy</h2>
            <p className="text-xs text-slate-400 leading-[1.45]">Mobile personal finance anywhere in the world</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 my-3 leading-[1.45]">
          Choose your local currency and number formatting. All amounts will strictly use your standard
          international formatting rules.
        </p>

        {/* Currency selection */}
        <div className="space-y-4 my-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Primary Currency (ISO 4217)
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] tabular-nums"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
              Number Formatting Locale
            </label>
            <select
              id="locale-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            >
              {COMMON_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-xs text-slate-400 block mb-1 font-medium">Live Format Preview</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-teal-400 font-medium">Sample Amount</span>
              <span className="text-lg font-semibold text-white tracking-tight tabular-nums">
                {formatCurrency(3450.75, currency, locale)}
              </span>
            </div>
          </div>

          {/* Demo sample data toggle */}
          <label className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              id="demo-data-toggle"
              checked={includeDemoData}
              onChange={(e) => setIncludeDemoData(e.target.checked)}
              className="mt-1 w-4 h-4 text-teal-500 rounded border-slate-700 focus:ring-teal-500 bg-slate-900"
            />
            <div className="text-xs text-slate-300 leading-[1.45]">
              <span className="font-semibold text-white block">Load sample transactions</span>
              Start with sample entries to easily test dashboard metrics and the Gemini advisor right away.
            </div>
          </label>
        </div>

        <button
          id="btn-onboarding-continue"
          onClick={handleSave}
          className="mt-5 w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-teal-900/30 flex items-center justify-center space-x-2 transition-all min-h-[48px]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Budget Buddy</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  RecurringTemplate,
  RecurringFrequency,
  CustomCategory,
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
} from '../../types';
import { formatCurrency, parseCleanAmount } from '../../utils/currencies';
import { getCategoryIcon } from '../../utils/categories';
import { formatFrequencyLabel } from '../../utils/recurring';
import {
  Repeat,
  Play,
  Pause,
  Pencil,
  Trash2,
  Calendar,
  Check,
  X,
  Clock,
} from 'lucide-react';

interface RecurringTemplatesSectionProps {
  recurringTemplates: RecurringTemplate[];
  currency: string;
  locale: string;
  customCategories: CustomCategory[];
  onUpdateRecurringTemplate: (updated: RecurringTemplate) => void;
  onTogglePauseRecurringTemplate: (id: string) => void;
  onDeleteRecurringTemplate: (id: string) => void;
}

export const RecurringTemplatesSection: React.FC<RecurringTemplatesSectionProps> = ({
  recurringTemplates,
  currency,
  locale,
  customCategories,
  onUpdateRecurringTemplate,
  onTogglePauseRecurringTemplate,
  onDeleteRecurringTemplate,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFrequency, setEditFrequency] = useState<RecurringFrequency>('monthly');
  const [editNextDueDate, setEditNextDueDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const handleStartEdit = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setEditAmountStr(String(template.amount));
    setEditCategory(template.category);
    setEditFrequency(template.frequency);
    setEditNextDueDate(template.nextDueDate);
    setEditNote(template.note || '');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const cleanAmount = parseCleanAmount(editAmountStr);
    if (cleanAmount <= 0) {
      setEditError('Please enter an amount greater than 0.');
      return;
    }

    if (!editCategory) {
      setEditError('Please select a category.');
      return;
    }

    if (!editNextDueDate) {
      setEditError('Please select a next due date.');
      return;
    }

    onUpdateRecurringTemplate({
      ...editingTemplate,
      amount: cleanAmount,
      category: editCategory,
      frequency: editFrequency,
      nextDueDate: editNextDueDate,
      note: editNote.trim() || undefined,
    });

    setEditingTemplate(null);
  };

  const availableCategories = editingTemplate?.type === 'income'
    ? INCOME_SOURCES
    : [...EXPENSE_CATEGORIES, ...customCategories.map((c) => c.name)];

  return (
    <div
      id="section-recurring-transactions"
      className="p-4 rounded-3xl bg-slate-800/50 border border-slate-700/60 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Repeat className="w-4 h-4 text-teal-400" />
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-heading">
            Recurring Transactions
          </h2>
        </div>
        {recurringTemplates.length > 0 && (
          <span className="text-[11px] font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">
            {recurringTemplates.length} {recurringTemplates.length === 1 ? 'Rule' : 'Rules'}
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 leading-[1.45]">
        Automated templates that log on schedule. You can pause, adjust, or delete them anytime.
        Past logged transactions will remain untouched.
      </p>

      {recurringTemplates.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
          <Clock className="w-6 h-6 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-medium">No recurring rules configured</p>
          <p className="text-[11px] text-slate-500 leading-snug">
            When logging any expense or income on the Add Entry screen, toggle &quot;This repeats&quot;
            to schedule automatic recurrence.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {recurringTemplates.map((template) => {
            const IconComponent = getCategoryIcon(template.category, customCategories);
            const isExpense = template.type === 'expense';
            const isConfirmingDelete = deletingTemplateId === template.id;

            return (
              <div
                key={template.id}
                id={`recurring-template-item-${template.id}`}
                className={`p-3.5 rounded-2xl border transition-all ${
                  template.isPaused
                    ? 'bg-slate-900/40 border-slate-800 opacity-75'
                    : 'bg-slate-800/80 border-slate-700/60'
                }`}
              >
                {/* Delete Confirmation Overlay */}
                {isConfirmingDelete ? (
                  <div className="space-y-2 py-1">
                    <p className="text-xs font-semibold text-rose-300 leading-snug">
                      Delete &quot;{template.category}&quot; recurring rule?
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Existing past entries created from it will remain untouched, only future
                      auto-creation stops.
                    </p>
                    <div className="flex space-x-2 pt-1">
                      <button
                        type="button"
                        id={`btn-confirm-delete-rec-${template.id}`}
                        onClick={() => {
                          onDeleteRecurringTemplate(template.id);
                          setDeletingTemplateId(null);
                        }}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold min-h-[40px]"
                      >
                        Delete Rule
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTemplateId(null)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium min-h-[40px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Icon & Info */}
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          template.isPaused
                            ? 'bg-slate-800 text-slate-500'
                            : isExpense
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">
                            {template.category}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                              template.isPaused
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                : 'bg-teal-500/15 text-teal-300 border border-teal-500/20'
                            }`}
                          >
                            {template.isPaused ? 'Paused' : 'Active'}
                          </span>
                        </div>

                        {template.category === 'Subscriptions' &&
                          template.subscriptions &&
                          template.subscriptions.length > 0 && (
                            <p className="text-[11px] text-slate-400 truncate leading-tight">
                              Includes: {template.subscriptions.map((s) => s.name).join(', ')}
                            </p>
                          )}

                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-white tabular-nums">
                            {formatCurrency(template.amount, currency, locale)}
                          </span>
                          <span>•</span>
                          <span className="capitalize font-medium text-teal-300">
                            {formatFrequencyLabel(template.frequency)}
                          </span>
                          <span>•</span>
                          <span className="tabular-nums text-slate-400">
                            Next: {template.nextDueDate}
                          </span>
                        </div>

                        {template.note && (
                          <p className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                            {template.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                      {/* Pause/Resume button */}
                      <button
                        type="button"
                        id={`btn-toggle-pause-${template.id}`}
                        onClick={() => onTogglePauseRecurringTemplate(template.id)}
                        className={`p-2 rounded-xl flex items-center justify-center min-w-[36px] min-h-[36px] transition-colors ${
                          template.isPaused
                            ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                            : 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300'
                        }`}
                        title={template.isPaused ? 'Resume auto-logging' : 'Pause auto-logging'}
                        aria-label={template.isPaused ? 'Resume rule' : 'Pause rule'}
                      >
                        {template.isPaused ? (
                          <Play className="w-4 h-4 fill-current" />
                        ) : (
                          <Pause className="w-4 h-4 fill-current" />
                        )}
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        id={`btn-edit-recurring-${template.id}`}
                        onClick={() => handleStartEdit(template)}
                        className="p-2 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                        title="Edit recurring template"
                        aria-label="Edit rule"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        id={`btn-delete-recurring-${template.id}`}
                        onClick={() => setDeletingTemplateId(template.id)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                        title="Delete recurring template"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Recurring Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Repeat className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white font-heading tracking-tight">
                  Edit Recurring Template
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Changes will apply to future auto-created entries. Past entries remain unchanged.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  id="select-edit-recurring-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Amount ({currency})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="input-edit-recurring-amount"
                  value={editAmountStr}
                  onChange={(e) =>
                    setEditAmountStr(e.target.value.replace(/[^0-9.]/g, ''))
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  placeholder="0.00"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      id={`btn-edit-freq-${freq}`}
                      onClick={() => setEditFrequency(freq)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all border min-h-[38px] ${
                        editFrequency === freq
                          ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {formatFrequencyLabel(freq)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Due Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Next Due Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    id="input-edit-recurring-next-due"
                    value={editNextDueDate}
                    onChange={(e) => setEditNextDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] tabular-nums"
                  />
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  id="input-edit-recurring-note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Monthly rent payout"
                  maxLength={80}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center">
                  {editError}
                </div>
              )}

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  id="btn-save-edit-recurring"
                  className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md shadow-teal-950/40 min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

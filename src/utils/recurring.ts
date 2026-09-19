import { RecurringTemplate, RecurringFrequency, Transaction } from '../types';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFrequencyLabel(freq: RecurringFrequency): string {
  switch (freq) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return 'Monthly';
  }
}

/**
 * Calculates the next due date forward by the selected frequency,
 * preserving calendar day of month safely.
 */
export function addFrequencyToDate(dateStr: string, frequency: RecurringFrequency): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

  if (frequency === 'weekly') {
    const d = new Date(year, month - 1, day, 12, 0, 0);
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dStr}`;
  }

  if (frequency === 'monthly') {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    // Max days in the target next month
    const maxDays = new Date(nextYear, nextMonth, 0).getDate();
    const nextDay = Math.min(day, maxDays);
    const mStr = String(nextMonth).padStart(2, '0');
    const dStr = String(nextDay).padStart(2, '0');
    return `${nextYear}-${mStr}-${dStr}`;
  }

  if (frequency === 'yearly') {
    const nextYear = year + 1;
    const maxDays = new Date(nextYear, month, 0).getDate();
    const nextDay = Math.min(day, maxDays);
    const mStr = String(month).padStart(2, '0');
    const dStr = String(nextDay).padStart(2, '0');
    return `${nextYear}-${mStr}-${dStr}`;
  }

  return dateStr;
}

/**
 * Evaluates all recurring templates against the current date.
 * If any template's nextDueDate is today or in the past (e.g. user hasn't opened the app in months),
 * retroactively spawns all missed transactions with their exact scheduled dates and advances nextDueDate.
 */
export function processDueRecurringTemplates(
  templates: RecurringTemplate[],
  currentDateStr: string = getTodayString()
): {
  updatedTemplates: RecurringTemplate[];
  newTransactions: Transaction[];
} {
  const newTransactions: Transaction[] = [];
  let anyUpdated = false;

  const updatedTemplates = templates.map((template) => {
    if (template.isPaused) {
      return template;
    }

    let nextDue = template.nextDueDate;
    let occurrencesGenerated = 0;
    // Hard cap at 104 occurrences per template to safeguard against corrupted historical dates
    const maxCatchUp = 104;

    while (nextDue <= currentDateStr && occurrencesGenerated < maxCatchUp) {
      occurrencesGenerated++;
      anyUpdated = true;

      const newTx: Transaction = {
        id: `tx-rec-${template.id}-${nextDue}-${Date.now()}-${occurrencesGenerated}`,
        type: template.type,
        amount: template.amount,
        category: template.category,
        date: nextDue,
        note: template.note,
        subscriptions: template.subscriptions
          ? template.subscriptions.map((s) => ({
              ...s,
              id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            }))
          : undefined,
        isRecurring: true,
        recurringTemplateId: template.id,
        createdAt: Date.now() + occurrencesGenerated,
      };

      newTransactions.push(newTx);

      // Advance next due date forward
      nextDue = addFrequencyToDate(nextDue, template.frequency);
    }

    if (occurrencesGenerated > 0) {
      return {
        ...template,
        nextDueDate: nextDue,
      };
    }

    return template;
  });

  return {
    updatedTemplates: anyUpdated ? updatedTemplates : templates,
    newTransactions,
  };
}

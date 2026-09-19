import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  Transaction,
  MonthlyBudget,
  UserSettings,
  ChatMessage,
  FinancialContext,
  CustomCategory,
  RecurringTemplate,
} from './types';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredTransactions,
  saveStoredTransactions,
  getStoredBudget,
  saveStoredBudget,
  getStoredChat,
  saveStoredChat,
  getStoredCustomCategories,
  saveStoredCustomCategories,
  getStoredRecurringTemplates,
  saveStoredRecurringTemplates,
  seedSampleData,
  DEFAULT_BUDGET,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { processDueRecurringTemplates, addFrequencyToDate } from './utils/recurring';
import { MobileShell } from './components/layout/MobileShell';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { AddEditEntryScreen, RecurringConfig } from './components/entry/AddEditEntryScreen';
import { HistoryScreen } from './components/history/HistoryScreen';
import { AdvisorScreen } from './components/advisor/AdvisorScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { CurrencyOnboardingModal } from './components/onboarding/CurrencyOnboardingModal';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [budget, setBudget] = useState<MonthlyBudget>(() => getStoredBudget());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getStoredChat());
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() =>
    getStoredCustomCategories()
  );
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>(() =>
    getStoredRecurringTemplates()
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredBudget(budget);
  }, [budget]);

  useEffect(() => {
    saveStoredChat(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    saveStoredCustomCategories(customCategories);
  }, [customCategories]);

  useEffect(() => {
    saveStoredRecurringTemplates(recurringTemplates);
  }, [recurringTemplates]);

  // On app launch, evaluate due recurring templates (backfills all missed occurrences retroactively)
  useEffect(() => {
    const templates = getStoredRecurringTemplates();
    if (templates.length > 0) {
      const { updatedTemplates, newTransactions } = processDueRecurringTemplates(templates);
      if (newTransactions.length > 0) {
        setTransactions((prev) => [...newTransactions, ...prev]);
        setRecurringTemplates(updatedTemplates);
        saveStoredRecurringTemplates(updatedTemplates);
      }
    }
  }, []);

  // Compute live current month financial context for AI advisor and dashboard
  const financialContext: FinancialContext = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysLeftInMonth = Math.max(0, totalDaysInMonth - currentDay);
    const monthName = now.toLocaleDateString(settings.locale, { month: 'long', year: 'numeric' });

    let income = 0;
    let expenses = 0;
    const catMap: Record<string, number> = {};

    const monthTransactions = transactions.filter((t) => {
      const [y, m] = t.date.split('-').map(Number);
      return y === currentYear && m === currentMonthIdx + 1;
    });

    for (const t of monthTransactions) {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expenses += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      }
    }

    const net = income - expenses;
    const monthlyBudgetTotal = budget.overallBudget || 0;
    const remainingBudget = monthlyBudgetTotal > 0 ? monthlyBudgetTotal - expenses : 0;
    const avgDailySpendRemaining =
      monthlyBudgetTotal > 0
        ? daysLeftInMonth > 0
          ? Math.max(0, remainingBudget / daysLeftInMonth)
          : Math.max(0, remainingBudget)
        : 0;

    const categoryBreakdown = Object.entries(catMap).map(([category, spent]) => {
      const catBudget = budget.categoryBudgets?.[category] || 0;
      const pct = catBudget > 0 ? (spent / catBudget) * 100 : 0;
      return { category, spent, budget: catBudget, pct };
    });

    const recent = [...transactions]
      .sort((a, b) => (b.date !== a.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt))
      .slice(0, 10)
      .map((t) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        note: t.note,
        subscriptions: t.subscriptions,
      }));

    return {
      currency: settings.currency,
      locale: settings.locale,
      currentMonth: monthName,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: net,
      monthlyBudget: monthlyBudgetTotal,
      remainingBudget,
      daysLeftInMonth,
      avgDailySpendRemaining,
      categoryBreakdown,
      recentTransactions: recent,
    };
  }, [transactions, budget, settings]);

  // Transaction handlers
  const handleSaveTransaction = (
    entry: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string,
    recurringConfig?: RecurringConfig
  ) => {
    let templateId = entry.recurringTemplateId;

    if (recurringConfig?.repeats) {
      if (!templateId) {
        // Create a new recurring template
        templateId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const nextDueDate = addFrequencyToDate(entry.date, recurringConfig.frequency);
        const newTemplate: RecurringTemplate = {
          id: templateId,
          type: entry.type,
          amount: entry.amount,
          category: entry.category,
          note: entry.note,
          frequency: recurringConfig.frequency,
          startDate: entry.date,
          nextDueDate,
          isPaused: false,
          subscriptions: entry.subscriptions,
          createdAt: Date.now(),
        };
        setRecurringTemplates((prev) => [newTemplate, ...prev]);
      } else {
        // Update existing recurring template
        setRecurringTemplates((prev) =>
          prev.map((t) =>
            t.id === templateId
              ? {
                  ...t,
                  type: entry.type,
                  amount: entry.amount,
                  category: entry.category,
                  note: entry.note,
                  frequency: recurringConfig.frequency,
                  subscriptions: entry.subscriptions,
                }
              : t
          )
        );
      }
    }

    const transactionToSave = {
      ...entry,
      isRecurring: Boolean(recurringConfig?.repeats || entry.isRecurring),
      recurringTemplateId: templateId,
    };

    if (existingId) {
      // Update existing
      setTransactions((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...transactionToSave } : item))
      );
    } else {
      // Add new
      const newTx: Transaction = {
        ...transactionToSave,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
    setEditingTransaction(null);
    setActiveTab('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setEditingTransaction(null);
    setActiveTab('dashboard');
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setActiveTab('add');
  };

  // AI Chat handler
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          financialContext,
        }),
      });

      if (!response.ok) {
        let errMessage = 'Unable to get advice right now.';
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          // ignore json parse error
        }

        const errorMsg: ChatMessage = {
          id: `msg-${Date.now()}-err`,
          role: 'model',
          content: errMessage,
          timestamp: Date.now(),
          isError: true,
        };
        setChatMessages([...updatedMessages, errorMsg]);
        return;
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'model',
        content: data.reply || 'No response received.',
        timestamp: Date.now(),
      };
      setChatMessages([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model',
        content: 'Network connection failed. Please check your connection and try again.',
        timestamp: Date.now(),
        isError: true,
      };
      setChatMessages([...updatedMessages, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleNavigateToAdvisor = (initialQuestion?: string) => {
    setActiveTab('advisor');
    if (initialQuestion && initialQuestion.trim()) {
      setTimeout(() => {
        handleSendMessage(initialQuestion.trim());
      }, 60);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
  };

  // Custom Category handlers
  const handleAddCustomCategory = (newCat: CustomCategory) => {
    setCustomCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteCustomCategory = (categoryName: string) => {
    setCustomCategories((prev) =>
      prev.filter((c) => c.name.toLowerCase() !== categoryName.toLowerCase())
    );

    // Existing entries using a deleted category should fall back to "Other" rather than breaking
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.type === 'expense' && t.category.toLowerCase() === categoryName.toLowerCase()) {
          return { ...t, category: 'Other' };
        }
        return t;
      })
    );

    // Clean up category budgets for this category if set
    if (budget.categoryBudgets?.[categoryName]) {
      const newBudgets = { ...budget.categoryBudgets };
      delete newBudgets[categoryName];
      setBudget({ ...budget, categoryBudgets: newBudgets });
    }
  };

  // Recurring template handlers for Settings
  const handleUpdateRecurringTemplate = (updated: RecurringTemplate) => {
    setRecurringTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleTogglePauseRecurringTemplate = (id: string) => {
    setRecurringTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPaused: !t.isPaused } : t))
    );
  };

  const handleDeleteRecurringTemplate = (id: string) => {
    setRecurringTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleResetAllData = () => {
    setTransactions([]);
    setBudget(DEFAULT_BUDGET);
    setChatMessages([]);
    setCustomCategories([]);
    setRecurringTemplates([]);
    setSettings({ ...DEFAULT_SETTINGS, hasCompletedOnboarding: true });
    setActiveTab('dashboard');
  };

  const handleOnboardingComplete = (newSettings: UserSettings, loadSample: boolean) => {
    setSettings(newSettings);
    if (loadSample && transactions.length === 0) {
      const { transactions: sampleTxs, budget: sampleBudget } = seedSampleData();
      setTransactions(sampleTxs);
      setBudget(sampleBudget);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950">
      {/* Onboarding Currency Modal for first launch */}
      {!settings.hasCompletedOnboarding && (
        <CurrencyOnboardingModal
          initialSettings={settings}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Main Shell */}
      <MobileShell
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab !== 'add') {
            setEditingTransaction(null);
          }
          setActiveTab(tab);
        }}
      >
        {activeTab === 'dashboard' && (
          <DashboardScreen
            transactions={transactions}
            budget={budget}
            settings={settings}
            customCategories={customCategories}
            onNavigateToAdd={() => {
              setEditingTransaction(null);
              setActiveTab('add');
            }}
            onNavigateToAdvisor={handleNavigateToAdvisor}
            onNavigateToHistory={() => setActiveTab('history')}
            onNavigateToSettings={() => setActiveTab('settings')}
            onEditTransaction={handleEditClick}
          />
        )}

        {activeTab === 'add' && (
          <AddEditEntryScreen
            settings={settings}
            customCategories={customCategories}
            editingTransaction={editingTransaction}
            onSave={handleSaveTransaction}
            onAddCustomCategory={handleAddCustomCategory}
            onDelete={editingTransaction ? handleDeleteTransaction : undefined}
            onCancel={() => {
              setEditingTransaction(null);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            transactions={transactions}
            settings={settings}
            customCategories={customCategories}
            onEditTransaction={handleEditClick}
            onNavigateToAdd={() => {
              setEditingTransaction(null);
              setActiveTab('add');
            }}
          />
        )}

        {activeTab === 'advisor' && (
          <AdvisorScreen
            messages={chatMessages}
            financialContext={financialContext}
            settings={settings}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isChatLoading}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            budget={budget}
            customCategories={customCategories}
            recurringTemplates={recurringTemplates}
            onUpdateSettings={setSettings}
            onUpdateBudget={setBudget}
            onDeleteCustomCategory={handleDeleteCustomCategory}
            onUpdateRecurringTemplate={handleUpdateRecurringTemplate}
            onTogglePauseRecurringTemplate={handleTogglePauseRecurringTemplate}
            onDeleteRecurringTemplate={handleDeleteRecurringTemplate}
            onResetAllData={handleResetAllData}
          />
        )}
      </MobileShell>
    </div>
  );
};

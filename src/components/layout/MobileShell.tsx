import React from 'react';
import { ActiveTab } from '../../types';
import { LayoutDashboard, PlusCircle, History, BotMessageSquare, Settings } from 'lucide-react';

interface MobileShellProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'add', label: 'Add Entry', icon: PlusCircle },
    { id: 'history', label: 'History', icon: History },
    { id: 'advisor', label: 'AI Advisor', icon: BotMessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex justify-center w-full h-full bg-slate-950">
      {/* Mobile-only app shell container (max-w-md, full height) */}
      <div className="w-full max-w-md h-full flex flex-col bg-slate-900 border-x border-slate-800/80 relative overflow-hidden shadow-2xl">
        {/* Top Status Bar Safe Area Spacer */}
        <div
          id="status-bar-spacer"
          className="w-full shrink-0 bg-slate-900/90 backdrop-blur-md"
          style={{ height: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          {children}
        </main>

        {/* Bottom Navigation Bar */}
        <nav
          id="bottom-tab-navigation"
          aria-label="Primary Mobile Navigation"
          className="shrink-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-30"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
          <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const isAdd = tab.id === 'add';

              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={tab.label}
                  className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] py-1 rounded-xl transition-all duration-150 relative ${
                    isActive ? 'text-teal-400 font-semibold' : 'text-slate-400 active:text-slate-200'
                  }`}
                >
                  {isAdd ? (
                    <div className="w-10 h-10 -mt-3 rounded-full bg-teal-600 active:bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/50 border-2 border-slate-900">
                      <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-400 rounded-full" />
                      )}
                    </div>
                  )}
                  <span className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${isAdd ? 'mt-1' : ''} ${isActive ? 'font-semibold text-teal-400' : 'font-medium text-slate-400'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

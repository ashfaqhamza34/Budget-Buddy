import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  FinancialContext,
  UserSettings,
} from '../../types';
import { formatCurrency } from '../../utils/currencies';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  Info,
} from 'lucide-react';

interface AdvisorScreenProps {
  messages: ChatMessage[];
  financialContext: FinancialContext;
  settings: UserSettings;
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  isLoading: boolean;
}

export const AdvisorScreen: React.FC<AdvisorScreenProps> = ({
  messages,
  financialContext,
  settings,
  onSendMessage,
  onClearChat,
  isLoading,
}) => {
  const { currency, locale } = settings;
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterQuestions = [
    'Can I afford a new pair of shoes this week?',
    'Where am I overspending this month?',
    'How much can I save if I cut eating out?',
    'How does my spending compare to the 50/30/20 rule?',
  ];

  const [showDisclaimerNote, setShowDisclaimerNote] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || !text.trim() || isLoading) return;
    setInputText('');
    await onSendMessage(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <BotMessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight font-heading tracking-tight">AI Financial Advisor</h1>
            <div className="flex items-center space-x-1.5 text-[10px] text-teal-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Advisor powered by AI</span>
              <button
                type="button"
                id="btn-advisor-header-info"
                onClick={() => setShowDisclaimerNote((prev) => !prev)}
                className="text-slate-400 hover:text-slate-200 active:text-white ml-0.5 p-0.5"
                title="AI advisor information"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            id="btn-clear-chat"
            onClick={onClearChat}
            className="p-2 text-slate-400 hover:text-rose-400 active:text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDisclaimerNote && (
        <div className="px-4 py-2 bg-slate-950 border-b border-teal-500/30 flex items-center justify-between text-[11px] text-slate-300">
          <span className="leading-[1.45]">Responses are AI-generated and may not always be accurate.</span>
          <button
            onClick={() => setShowDisclaimerNote(false)}
            className="text-slate-400 hover:text-white ml-2 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Month Financial Context Badge */}
      <div className="px-4 py-2 bg-slate-800/60 border-b border-slate-800 shrink-0 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center space-x-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span>
            Spent:{' '}
            <strong className="text-white font-semibold tabular-nums">
              {formatCurrency(financialContext.totalExpenses, currency, locale)}
            </strong>
          </span>
        </div>
        <div>
          <span>
            Rem. Budget:{' '}
            <strong
              className={`tabular-nums font-semibold ${
                financialContext.remainingBudget >= 0 ? 'text-teal-300' : 'text-rose-400'
              }`}
            >
              {formatCurrency(financialContext.remainingBudget, currency, locale)}
            </strong>
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-semibold text-white font-heading tracking-tight">Ask anything about your money</h2>
            <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4 leading-[1.45]">
              I analyze your actual expenses, remaining budget ({currency}), and spending categories
              to give personalized, realistic guidance.
            </p>

            {/* Suggested Starter Questions */}
            <div className="w-full space-y-2 max-w-sm text-left">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block px-1">
                Suggested questions:
              </span>
              {starterQuestions.map((q, idx) => (
                <button
                  key={idx}
                  id={`starter-q-${idx}`}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-3 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 active:scale-[0.99] transition-all min-h-[44px] leading-[1.45]"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-[1.45] font-normal ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-br-sm shadow-md'
                      : msg.isError
                      ? 'bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-bl-sm'
                      : 'bg-slate-800 border border-slate-700/70 text-slate-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.isError ? (
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="leading-[1.45]">{msg.content}</p>
                        <button
                          onClick={() => handleSend(messages[messages.length - 2]?.content)}
                          className="mt-2 text-[11px] font-semibold text-rose-300 underline flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry question</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line space-y-1.5 leading-[1.45]">
                      {msg.content}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1 tabular-nums">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 rounded-bl-sm flex items-center space-x-2 text-xs text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-slate-400 ml-1">Analyzing spending...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Financial Disclaimer */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center space-x-1 text-[10px] text-slate-400 shrink-0">
        <Info className="w-3 h-3 shrink-0" />
        <span className="truncate">Responses are AI-generated and may not always be accurate.</span>
      </div>

      {/* Bottom Chat Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            id="input-advisor-query"
            placeholder="Ask anything about your budget..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500 min-h-[44px]"
          />
          <button
            id="btn-advisor-send"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-teal-600 active:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-md min-h-[44px] min-w-[44px]"
            title="Send inquiry to AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

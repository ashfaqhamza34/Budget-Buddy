import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();
app.use(express.json());

// Rate limiting on /api/chat: 15 requests per 5 minutes per IP
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait a few moments before asking again.',
  },
  statusCode: 429,
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, history = [], financialContext } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A message prompt is required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Server error: GEMINI_API_KEY is not defined in environment.');
      return res.status(500).json({
        error: 'AI service is temporarily unavailable. Please try again later.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const currency = financialContext?.currency || 'USD';
    const locale = financialContext?.locale || 'en-US';

    const systemInstruction = `You are Budget Buddy AI, a practical, empathetic, non-judgmental, and globally-applicable personal financial advisor.
Your mission is to help users manage their money wisely using proven, universal principles (e.g. 50/30/20 budgeting guidelines, building an emergency cushion of 3-6 months, prioritizing high-interest debt payoff, and preventing lifestyle inflation).
Do NOT assume a specific country, currency symbol, or tax system unless the user explicitly refers to their own region.

CRITICAL CURRENCY RULES:
- The user's active currency is ${currency}.
- You MUST ALWAYS display all amounts with the currency code ${currency} (e.g. "${currency} 150", "${currency} 45.00").
- NEVER hardcode '$' or other symbols unless the currency is USD.

CURRENT MONTH FINANCIAL SNAPSHOT (${financialContext?.currentMonth || 'Current Month'}):
- Currency: ${currency} (Formatting Locale: ${locale})
- Total Income: ${currency} ${financialContext?.totalIncome ?? 0}
- Total Expenses: ${currency} ${financialContext?.totalExpenses ?? 0}
- Net Balance: ${currency} ${financialContext?.netBalance ?? 0}
- Monthly Budget Target: ${financialContext?.monthlyBudget ? `${currency} ${financialContext.monthlyBudget}` : 'Not set'}
- Remaining Budget: ${financialContext?.remainingBudget != null ? `${currency} ${financialContext.remainingBudget}` : 'N/A'}
- Days Remaining in Month: ${financialContext?.daysLeftInMonth ?? 'N/A'}
- Average Daily Spend Allowance Remaining: ${financialContext?.avgDailySpendRemaining != null ? `${currency} ${financialContext.avgDailySpendRemaining}` : 'N/A'}

Category Breakdown for Current Month:
${(financialContext?.categoryBreakdown || [])
  .map(
    (c: { category: string; spent: number; budget?: number; pct: number }) =>
      `- ${c.category}: ${currency} ${c.spent}${c.budget ? ` (Budget: ${currency} ${c.budget}, ${c.pct.toFixed(0)}% used)` : ''}`
  )
  .join('\n') || '- No category expenses logged yet'}

Recent Transactions:
${(financialContext?.recentTransactions || [])
  .slice(0, 10)
  .map(
    (t: { type: string; category: string; amount: number; date: string; note?: string; subscriptions?: Array<{ name: string; amount: number }> }) =>
      `- [${t.type.toUpperCase()}] ${t.category}: ${currency} ${t.amount} on ${t.date}${t.subscriptions?.length ? ` (Includes: ${t.subscriptions.map((s) => `${s.name} ${currency} ${s.amount}`).join(', ')})` : ''}${t.note ? ` ("${t.note}")` : ''}`
  )
  .join('\n') || '- No transactions recorded yet'}

RESPONSE STYLE GUIDELINES:
1. Keep replies concise, readable, and structured for a mobile device viewport (short bullet points, bold highlights, max 2-3 short paragraphs).
2. Answer questions like "Can I afford [item]?" with a balanced evaluation based on their remaining budget, daily burn rate, and necessity.
3. Be supportive, practical, and non-judgmental about previous spending mistakes.
4. Conclude your answer with a gentle reminder: "Budget Buddy AI provides general suggestions, not certified professional financial advice."`;

    // Build chat turns
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: item.content }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    // Attempt requested gemini-2.5-flash with graceful fallback to gemini-3.6-flash if deprecated
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    } catch (modelErr: any) {
      console.warn('gemini-2.5-flash failed, attempting gemini-3.6-flash fallback:', modelErr?.message || modelErr);
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
    }

    const reply = response.text || 'I was unable to formulate an answer. Please try rephrasing.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error handling /api/chat:', error);
    return res.status(500).json({
      error: 'Unable to connect to AI advisor. Please try again in a few moments.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Budget Buddy' });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Budget Buddy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Budget Buddy server:', err);
});

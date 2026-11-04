import React, { useState } from 'react';
import {
  Receipt,
  DollarSign,
  Plus,
  Trash2,
  TrendingDown,
  Sparkles,
  PieChart,
  CheckCircle2,
  Undo2,
  FileText,
} from 'lucide-react';
import { useRouteXStore, ExpenseItem } from '../../context/RouteXStore';

const CATEGORIES: Array<{ id: ExpenseItem['category']; label: string; color: string }> = [
  { id: 'flight', label: 'Flights & Air', color: 'bg-primary' },
  { id: 'hotel', label: 'Lodging / Hotel', color: 'bg-indigo-600' },
  { id: 'meals', label: 'Meals & Dining', color: 'bg-amber-600' },
  { id: 'ground_transport', label: 'Ground Transit', color: 'bg-emerald-600' },
  { id: 'other', label: 'Incidentals', color: 'bg-slate-600' },
];

export function ExpenseTracker() {
  const { state, dispatch } = useRouteXStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReceiptParser, setShowReceiptParser] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseItem['category']>('meals');

  const totalSpent = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const recoverySpent = state.expenses
    .filter((e) => e.isRecoveryExpense)
    .reduce((sum, e) => sum + e.amount, 0);
  const recoveryBudgetLeft = Math.max(0, state.params.budgetCeiling - recoverySpent);

  // Group by category
  const categoryTotals = CATEGORIES.map((cat) => {
    const amount = state.expenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return { ...cat, amount, pct };
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (!newTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    dispatch({
      type: 'ADD_EXPENSE',
      expense: {
        tripId: state.activeTripId,
        category: newCategory,
        title: newTitle.trim(),
        amount: Math.round(parsedAmount),
        currency: 'USD',
        isRecoveryExpense: false,
      },
    });

    setNewTitle('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleParseReceipt = () => {
    if (!receiptText.trim()) return;
    const clean = receiptText.toLowerCase();

    // Extract dollar amount
    const amtMatch = clean.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
    const amt = amtMatch ? Math.round(parseFloat(amtMatch[1])) : 25;

    let cat: ExpenseItem['category'] = 'other';
    let title = 'Receipt Item';

    if (/taxi|uber|lyft|cab|train|metro/i.test(clean)) {
      cat = 'ground_transport';
      title = 'Ground Transport (Taxi/Transit)';
    } else if (/hotel|room|marriott|hilton|radisson/i.test(clean)) {
      cat = 'hotel';
      title = 'Hotel Lodging Surcharge';
    } else if (/food|coffee|restaurant|cafe|dinner|lunch|breakfast/i.test(clean)) {
      cat = 'meals';
      title = 'Airport Dining / Meal';
    }

    dispatch({
      type: 'ADD_EXPENSE',
      expense: {
        tripId: state.activeTripId,
        category: cat,
        title,
        amount: amt,
        currency: 'USD',
        isRecoveryExpense: false,
      },
    });

    setReceiptText('');
    setShowReceiptParser(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Budget Remaining Summary */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Manrope'] font-bold text-sm text-foreground">
              Trip Expenses & Recovery Budget
            </h3>
            <span className="text-[12px] text-muted-foreground">
              All currency fixed in USD • Synthetic rates
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setShowReceiptParser(!showReceiptParser)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary/50 text-xs font-semibold hover:bg-secondary text-foreground flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Paste Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* 2-Card Metric Ribbon */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-secondary/40 border border-border">
            <span className="text-[12px] text-muted-foreground block">Total Trip Outlay</span>
            <span className="font-['Manrope'] font-bold text-lg text-foreground block mt-0.5">
              ${totalSpent} USD
            </span>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[12px] text-primary font-semibold block">Recovery Budget Left</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-['Manrope'] font-bold text-lg text-primary">
                ${recoveryBudgetLeft}
              </span>
              <span className="text-[12px] text-muted-foreground">/ ${state.params.budgetCeiling} Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Bar Chart (Reference 3 & Reference 4 style) */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-primary" />
            Category Breakdown
          </span>
          <span className="text-[12px] text-muted-foreground font-medium">Proportional Outlay</span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden flex">
          {categoryTotals.map(
            (cat) =>
              cat.amount > 0 && (
                <div
                  key={cat.id}
                  style={{ width: `${cat.pct}%` }}
                  className={`${cat.color} h-full transition-all`}
                  title={`${cat.label}: $${cat.amount} (${cat.pct}%)`}
                />
              )
          )}
        </div>

        {/* Category Legend Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          {categoryTotals.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/20">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                <span className="text-[12px] text-muted-foreground">{cat.label}</span>
              </div>
              <span className="font-bold text-foreground text-xs font-mono">${cat.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Paste Receipt Parser Drawer */}
      {showReceiptParser && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Llama Receipt Parser
            </span>
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
              Draft Proposal
            </span>
          </div>
          <textarea
            rows={2}
            value={receiptText}
            onChange={(e) => setReceiptText(e.target.value)}
            placeholder="e.g. Uber receipt: $42.50 Frankfurt Airport to Radisson Hotel..."
            className="w-full text-xs p-2.5 rounded-lg border border-border bg-card text-foreground"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReceiptParser(false)}
              className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleParseReceipt}
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
            >
              Parse & Confirm
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Expense Form */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="p-4 rounded-xl border border-border bg-card shadow-lg space-y-3">
          <h4 className="font-bold text-xs text-foreground">Log New Outlay</h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                Title / Vendor
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Airport Hotel Stay / Transit Taxi"
                className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="meals">Meals</option>
                  <option value="ground_transport">Transit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="45"
                  className="w-full text-xs p-2 rounded-lg border border-border bg-secondary/30 text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold"
            >
              Add Expense
            </button>
          </div>
        </form>
      )}

      {/* Itemized Expenses List */}
      <div className="space-y-2">
        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block">
          Itemized Ledger ({state.expenses.length} entries)
        </span>

        {state.expenses.map((exp) => (
          <div
            key={exp.id}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              exp.isRecoveryExpense
                ? 'border-primary/40 bg-primary/[0.03]'
                : 'border-border bg-card'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{exp.title}</span>
                {exp.isRecoveryExpense && (
                  <span className="text-[12px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                    Auto-Logged Recovery
                  </span>
                )}
              </div>
              <span className="text-[12px] text-muted-foreground capitalize">
                {exp.category.replace('_', ' ')} • {exp.timestamp ? new Date(exp.timestamp).toLocaleDateString() : 'Active'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-['Manrope'] font-bold text-foreground text-sm tabular-nums">
                ${exp.amount} USD
              </span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DELETE_EXPENSE', id: exp.id })}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete expense"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

